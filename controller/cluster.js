'use strict';
const async = require('async');
const log = require('../common/log');
const cluster = require('../model/cluster');
const userAcl = require('../model/user_acl');

function getFilterCluster(gClusterConfig, req) {
  let clusterConfig = {};
  Object.keys(gClusterConfig).forEach((clusterCode) => {
    if (req.user.containsCluster(clusterCode)) {
      clusterConfig[clusterCode] = cluster.gClusterConfig[clusterCode];
    }
  });
  return clusterConfig;
}


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
    opItemId: clusterCode
  });
  let clusterName = req.body.name;
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
  log.debug('cluster info:', clusterName, clusterCode, token, endpoint, ips);
  if (!clusterName || !clusterCode || !token || !endpoint || !ips) {
    return callback('form data missing.');
  }
  if (isUpdate) {
    cluster.updateCluster(clusterName, clusterCode, token, endpoint, function (err) {
      if (err) {
        log.error(err);
        return callback(err);
      }
      cluster.deleteWorkers(clusterCode, (err) => {
        if (err) {
          return callback(err);
        }
        async.eachSeries(ips, (ip, cb) => {
          cluster.addWorker(ip, clusterCode, cb);
        }, (err) => {
          if (err) {
            log.error(err);
            return callback(err);
          }
          //callback(null, cluster.gClusterConfig);
          callback(null, getFilterCluster(cluster.gClusterConfig, req));
        });
      });
    });
  } else {
    cluster.addCluster(clusterName, clusterCode, token, endpoint, function (err) {
      if (err) {
        log.error(err);
        return callback(err);
      }
      async.eachSeries(ips, (ip, cb) => {
        cluster.addWorker(ip, clusterCode, cb);
      }, (err) => {
        if (err) {
          log.error(err);
          return callback(err);
        }
        cluster.getClusterCfg(function (err) {
          if (err) callback(new Error('getClusterCfg fail before add cluster acl'));
          let newCluster = cluster.gClusterConfig[clusterCode];
          if (!newCluster) callback(new Error('get new cluster fail after getClusterCfg'));
          userAcl.addUserAcl(req.user.name, newCluster.id, clusterCode, clusterName, 1, '["*"]', function (err) {
            //callback(err, cluster.gClusterConfig);
            callback(err, getFilterCluster(cluster.gClusterConfig, req));
          });
        });
      });
    });
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
    opItemId: clusterCode
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
      userAcl.deleteClusterAllAcl(clusterCode,function (err) {
        if (err) {
          log.error('delete cluster acl failed:', err);
          return callback({code: err.code || 'ERROR', message: err.message});
        }
        callback(null, 'delete cluster success');
      });
    });
  });
};

