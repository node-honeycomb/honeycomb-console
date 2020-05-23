'use strict';
const async = require('async');
const log = require('../common/log');
const cluster = require('../model/cluster');
const userAcl = require('../model/user_acl');
const lodash = require('lodash');
const utils = require('../common/utils');
const callremote = utils.callremote;

function getFilterCluster(gClusterConfig, req) {
  let clusterConfig = {};
  Object.keys(gClusterConfig).forEach((clusterCode) => {
    if (req.user.containsCluster(clusterCode)) {
      clusterConfig[clusterCode] = lodash.cloneDeep(
        cluster.gClusterConfig[clusterCode]
      );
    }
  });
  Object.keys(clusterConfig).forEach((clusterCode) => {
    if (req.user.isClusterAdmin(clusterCode)) {
      return;
    } else {
      clusterConfig[clusterCode].token = 'Unauthorized';
    }
  });
  return clusterConfig;
}

/**
 * @api {GET} /service/cluster/:code
 */
exports.getClusterConfig = function (req, callback) {
  let clusterCode = req.params.code;
  cluster.getClusterCfg(function (err) {
    if (err) {
      log.error('Get cluster config from db failed.', err);
      let e = new Error('Get cluster config from db failed.' + err.message);
      return callback(e);
    }
    callback(null, cluster.gClusterConfig[clusterCode]);
  });
};

/**
 * @api {GET} /api/cluster/list
 */
exports.listCluster = function (req, callback) {
  cluster.getClusterCfg(function (err) {
    if (err) {
      log.error('Get cluster config from db failed.', err);
      let e = new Error('Get cluster config from db failed.' + err.message);
      return callback(e);
    }
    callback(null, getFilterCluster(cluster.gClusterConfig, req));
  });
};

/**
 * @api {post} /api/cluster/create
 */
exports.addCluster = function (req, callback) {
  let clusterCode = req.body.code;
  let isUpdate = req.body.isUpdate;
  req.oplog({
    clientId: req.ips.join('') || '-',
    opName: isUpdate ? 'UPDATE_CLUSTER' : 'ADD_CLUSTER',
    opType: 'PAGE_MODEL',
    opLogLevel: 'NORMAL',
    opItem: 'CLUSTER',
    opItemId: clusterCode,
    opEnv: req.body.env,
  });
  let clusterName = req.body.name;
  let clusterEnv = req.body.env;
  let token = req.body.token;
  if (token === '***********') {
    let opt = cluster.getClusterCfgByCode(clusterCode);
    if (opt.code === 'ERROR') {
      return callback(opt);
    }
    token = opt.token;
  }
  let endpoint = req.body.endpoint;
  let ips = req.body.ips;
  log.debug(
    'cluster info:',
    clusterName,
    clusterCode,
    token,
    endpoint,
    ips,
    clusterEnv
  );
  if (!clusterName || !clusterCode || !token || !endpoint || !ips) {
    return callback('form data missing.');
  }
  if (isUpdate) {
    cluster.updateCluster(
      clusterName,
      clusterCode,
      token,
      endpoint,
      clusterEnv,
      function (err) {
        if (err) {
          log.error(err.message);
          return callback(err);
        }
        cluster.deleteWorkers(clusterCode, (err) => {
          if (err) {
            return callback(err);
          }
          async.eachSeries(
            ips,
            (ip, cb) => {
              cluster.addWorker(ip, clusterCode, cb);
            },
            (err) => {
              if (err) {
                log.error(err);
                return callback(err);
              }
              //callback(null, cluster.gClusterConfig);
              callback(null, getFilterCluster(cluster.gClusterConfig, req));
            }
          );
        });
      }
    );
  } else {
    cluster.addCluster(
      clusterName,
      clusterCode,
      token,
      endpoint,
      clusterEnv,
      function (err) {
        if (err) {
          log.error(err.message);
          return callback(err);
        }
        async.eachSeries(
          ips,
          (ip, cb) => {
            cluster.addWorker(ip, clusterCode, cb);
          },
          (err) => {
            if (err) {
              log.error(err);
              return callback(err);
            }
            cluster.getClusterCfg(function (err) {
              if (err)
                callback(
                  new Error('getClusterCfg fail before add cluster acl')
                );
              let newCluster = cluster.gClusterConfig[clusterCode];
              if (!newCluster)
                callback(new Error('get new cluster fail after getClusterCfg'));
              userAcl.addUserAcl(
                req.user.name,
                newCluster.id,
                clusterCode,
                clusterName,
                1,
                '["*"]',
                function (err) {
                  //callback(err, cluster.gClusterConfig);
                  callback(err, getFilterCluster(cluster.gClusterConfig, req));
                }
              );
            });
          }
        );
      }
    );
  }
};

/**
 * @api {post} /api/cluster/:code/delete
 */
exports.removeCluster = function (req, callback) {
  let clusterCode = req.params.code;
  req.oplog({
    clientId: req.ips.join('') || '-',
    opName: 'DELETE_CLUSTER',
    opType: 'PAGE_MODEL',
    opLogLevel: 'NORMAL',
    opItem: 'CLUSTER',
    opItemId: clusterCode,
  });
  log.info('delete cluster: ', clusterCode);
  cluster.deleteCluster(clusterCode, function (err) {
    if (err) {
      log.error('delete cluster failed:', err);
      return callback({ code: err.code || 'ERROR', message: err.message });
    }
    cluster.deleteWorkers(clusterCode, function (err) {
      if (err) {
        log.error('delete cluster worker failed:', err);
        return callback({ code: err.code || 'ERROR', message: err.message });
      }
      userAcl.deleteClusterAllAcl(clusterCode, function (err) {
        if (err) {
          log.error('delete cluster acl failed:', err);
          return callback({ code: err.code || 'ERROR', message: err.message });
        }
        callback(null, 'delete cluster success');
      });
    });
  });
};

/**
 * @api {GET} /api/cluster/fix
 */
exports.fixCluster = function (req, callback) {
  let clusterCode = req.query.clusterCode;
  cluster.fixCluster(clusterCode, callback);
};


const fs = require('xfs');
const os = require('os');
const path = require('path');
const uuid = require('uuid').v4;
const tar = require('tar');
const appConfig = require('../model/app_config');
const appPackage = require('../model/app_package');
const promisify = require('util').promisify;
const getSnapshortSync = promisify(cluster.getSnapshort);
const getAppConfig = promisify(appConfig.getAppConfig);
const getAppPackage = promisify(appPackage.getPackage);
const mv = promisify(fs.mv);
const yaml = require('yaml');
/**
 * 下载集群的patch包
 * @api {GET} /api/cluster/patch
 * @nowrap
 */
exports.downloadClusterPatch = async function (req, res, next) {
  let clusterCode = req.query.clusterCode;
  let clusterSnp = await getSnapshortSync(clusterCode);

  let tmpDir = path.join(os.tmpdir(), uuid(), 'cluster_patch');

  if (!clusterSnp) {
    let e = new Error('empty');
    e.statusCode = 404;
    return res.json({code: 'ERROR', data: 'empty'});
  }
  let serverCfg = await getAppConfig(clusterCode, 'server', 'server');

  if (serverCfg) {
    fs.sync().save(path.join(tmpDir, 'conf/custom/server.json'), JSON.stringify(serverCfg.config, null, 2));
  }
  let commonCfg = await getAppConfig(clusterCode, 'server', 'common');
  if (commonCfg) {
    fs.sync().save(path.join(tmpDir, 'conf/custom/common.json'), JSON.stringify(commonCfg.config, null, 2));
  }

  fs.sync().mkdir(path.join(tmpDir, 'run/appsRoot/'));
  /*
  { 
    name: 'socket-app',
    versions:[ 
      { 
        version: '1.0.0',
        buildNum: '2',
        publishAt: '5/22/2020, 2:34:00 PM',
        appId: 'socket-app_1.0.0_2',
        weight: 1000000.002,
        cluster: [Array],
        isCurrWorking: true 
      }
    ]
  }
  */
  let apps = {};
  for (let i = 0; i < clusterSnp.info.length; i++) {
    let app = clusterSnp.info[i];
    for (let n = 0; n < app.versions.length; n++) {
      let v = app.versions[n];
      if (!v.isCurrWorking) {
        continue;
      }
      let appCfg = await getAppConfig(clusterCode, 'app', app.name);
      if (appCfg) {
        fs.sync().save(path.join(tmpDir, `conf/custom/apps/${app.name}.json`), JSON.stringify(appCfg.config, null, 2));
      }
      let pkg = await getAppPackage(clusterCode, v.appId);
      if (pkg) {
        await mv(pkg.package, path.join(tmpDir, `run/appsRoot/${v.appId}.tgz`));
        apps[v.appId] = {
          dir: `/home/admin/honeycomb/run/appsRoot/${v.appId}`
        };
      }
    }
  }
  if (Object.keys(apps).length) {
    fs.sync().save(path.join(tmpDir, 'run/app.mount.info.yaml'), yaml.stringify(apps));
  }
  res.writeHead(200, {
    'Content-Type': 'application/force-download',
    'Content-Disposition': 'attachment; filename=cluster_patch.tgz'
  });

  tar.c({
      gzip: true,
      cwd: path.dirname(tmpDir),
    },
    ['cluster_patch']
  ).pipe(res);
};
