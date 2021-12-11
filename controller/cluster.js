const os = require('os');
const fs = require('xfs');
const tar = require('tar');
const yaml = require('yaml');
const path = require('path');
const async = require('async');
const uuid = require('uuid').v4;
const lodash = require('lodash');
const promisify = require('util').promisify;

const log = require('../common/log');
const cluster = require('../model/cluster');
const userAcl = require('../model/user_acl');
const appConfig = require('../model/app_config');
const appPackage = require('../model/app_package');
const getSnapshotSync = promisify(cluster.getSnapshot);
const getAppConfig = promisify(appConfig.getAppConfig);
const getAppPackage = promisify(appPackage.getPackage);


function getFilterCluster(gClusterConfig, req) {
  const clusterConfig = {};

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
  const clusterCode = req.params.code;

  cluster.getClusterCfg(function (err) {
    if (err) {
      log.error('Get cluster config from db failed.', err);
      const e = new Error('Get cluster config from db failed.' + err.message);

      return callback(e);
    }
    callback(null, cluster.gClusterConfig[clusterCode]);
  });
};

/**
 * 获取当前用户的集群列表
 * @api {GET} /api/cluster/list
 */
exports.listCluster = function (req, callback) {
  cluster.getClusterCfg(function (err) {
    if (err) {
      log.error('Get cluster config from db failed.', err);
      const e = new Error('Get cluster config from db failed.' + err.message);

      return callback(e);
    }
    callback(null, getFilterCluster(cluster.gClusterConfig, req));
  });
};

/**
 * 创建一个集群
 * @api {post} /api/cluster/create
 * @body
 *  code {String} 集群code
 *  isUpdate {String} 是否是更新 true | false
 *  name {String} 集群名称
 *  env {String} 集群环境 dev | prod | pre
 *  token {String} 集群token
 *  endpoint {String} 集群endpoint http://
 *  ips {String} 集群内的IP列表, 一行一个
 */
exports.addCluster = function (req, callback) {
  const clusterCode = req.body.code;
  const isUpdate = req.body.isUpdate;

  req.oplog({
    clientId: req.ips.join('') || '-',
    opName: isUpdate ? 'UPDATE_CLUSTER' : 'ADD_CLUSTER',
    opType: 'PAGE_MODEL',
    opLogLevel: 'NORMAL',
    opItem: 'CLUSTER',
    opItemId: clusterCode,
    // opEnv: req.body.env,
  });

  const clusterName = req.body.name;
  const clusterEnv = req.body.env;
  let token = req.body.token;
  const monitor = req.body.monitor || null;

  if (token === '***********') {
    const opt = cluster.getClusterCfgByCode(clusterCode);

    if (opt.code === 'ERROR') {
      return callback(opt);
    }
    token = opt.token;
  }
  const endpoint = req.body.endpoint;
  const ips = req.body.ips;

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
      monitor,
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
              // callback(null, cluster.gClusterConfig);
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
      monitor,
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
              const newCluster = cluster.gClusterConfig[clusterCode];

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
                  // callback(err, cluster.gClusterConfig);
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
 * 删除一个集群
 * @api {post} /api/cluster/:code/delete
 */
exports.removeCluster = function (req, callback) {
  const clusterCode = req.params.code;

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

      return callback({code: err.code || 'ERROR', message: err.message});
    }
    cluster.deleteWorkers(clusterCode, function (err) {
      if (err) {
        log.error('delete cluster worker failed:', err);

        return callback({code: err.code || 'ERROR', message: err.message});
      }
      userAcl.deleteClusterAllAcl(clusterCode, function (err) {
        if (err) {
          log.error('delete cluster acl failed:', err);

          return callback({code: err.code || 'ERROR', message: err.message});
        }
        callback(null, 'delete cluster success');
      });
    });
  });
};

/**
 * 订正集群的token
 * @api {GET} /api/cluster/fix
 */
exports.fixCluster = function (req, callback) {
  const clusterCode = req.query.clusterCode;

  cluster.fixCluster(clusterCode, callback);
};


const mv = promisify(fs.mv);

/**
 * 下载集群的patch包
 * @api {GET} /api/cluster/patch
 * @nowrap
 */
exports.downloadClusterPatch = async function (req, res) {
  try {
    const clusterCode = req.query.clusterCode;
    const clusterSnp = await getSnapshotSync(clusterCode);

    const tmpDir = path.join(os.tmpdir(), uuid(), 'cluster_patch');

    if (!clusterSnp) {
      res.statusCode = 404;

      return res.json({code: 'ERROR', data: 'empty'});
    }
    const serverCfg = await getAppConfig(clusterCode, 'server', 'server');

    if (serverCfg) {
      fs.sync()
        .save(
          path.join(
            tmpDir, 'conf/custom/server.json'),
          JSON.stringify(serverCfg.config, null, 2)
        );
    }
    const commonCfg = await getAppConfig(clusterCode, 'server', 'common');

    if (commonCfg) {
      fs.sync()
        .save(
          path.join(tmpDir, 'conf/custom/common.json'),
          JSON.stringify(commonCfg.config, null, 2)
        );
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
    const apps = {};

    for (let i = 0; i < clusterSnp.info.length; i++) {
      const app = clusterSnp.info[i];

      for (let n = 0; n < app.versions.length; n++) {
        const v = app.versions[n];

        if (!v.isCurrWorking) {
          continue;
        }
        const appCfg = await getAppConfig(clusterCode, 'app', app.name);

        if (appCfg) {
          fs.sync().save(
            path.join(tmpDir, `conf/custom/apps/${app.name}.json`),
            JSON.stringify(appCfg.config, null, 2)
          );
        }
        let pkg;

        if (req.query.force) {
          try {
            pkg = await getAppPackage(clusterCode, v.appId);
          } catch (e) {
            log.error('download app pkg from filerepo failed, force ignore', clusterCode, app.name);
          }
        } else {
          pkg = await getAppPackage(clusterCode, v.appId);
        }
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
  } catch (e) {
    res.statusCode = 500;
    res.json({code: 'ERROR', message: e.message});
  }
};

/**
 * 删除某一个版本的快照
 * @api {delete} /api/cluster/snapshot/delete
 * @body
 *  clusterCode {String} 集群code
 *  snapshotId {Number} 快照版本id
 */
exports.deleteSnapshot = async (req, cb) => {
  const {clusterCode, snapshotId} = req.body;

  if (!clusterCode) {
    return cb('missing query: snapshotId');
  }

  if (!snapshotId) {
    return cb('missing query: snapshotId');
  }

  cluster.deleteSnapshot(clusterCode, snapshotId, cb);
};

/**
 * 查询所有的 snapshot
 * @api {get} /api/cluster/snapshot/list
 * @query
 *    clusterCode {String} 集群code
 */
exports.listSnapshot = async (req, cb) => {
  const {clusterCode} = req.query;

  if (!clusterCode) {
    return cb(null, []);
  }

  const result = await promisify(cluster.listSnapshot)(clusterCode);

  return cb(null, result);
};

