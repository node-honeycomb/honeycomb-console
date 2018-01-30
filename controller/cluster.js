'use strict';
const async = require('async');
const log = require('../common/log');
const cluster = require('../model/cluster');
const userAcl = require('../model/user_acl');

function getFilterCluster(gClusterConfig, clusterAcl) {
  if (!gClusterConfig || !clusterAcl) return {};
  let filterCluster = {};
  Object.keys(clusterAcl).map((authorizedCluster) => {
    if (gClusterConfig[authorizedCluster]) {
      filterCluster[authorizedCluster] = gClusterConfig[authorizedCluster];
    }
  });
  return filterCluster;
}

/**
 * @api /api/cluster
 */
exports.getClusterCfg = function (req, callback) {
  cluster.getClusterCfg(function (err) {
    if (err) {
      log.error('Get cluster config from db failed.', err);
      let e = new Error('Get cluster config from db failed.' + err.message);
      return callback(e);
    }
    callback(null, getFilterCluster(cluster.gClusterConfig, req.session.user.clusterAcl));
  });
};

/**
 * @api /api/cluster_config/:clusterCode
 * @param
 *   clusterCode
 */
exports.getClusterCfgByCode = function (req, callback) {
  let clusterCode = req.params.clusterCode;
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
 * @api {post} /api/cluster
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
          callback(null, getFilterCluster(cluster.gClusterConfig, req.session.user.clusterAcl));
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
          userAcl.addUserAcl(req.session.user.nickname, clusterCode, 1, '["*"]', function (err) {
            callback(err, getFilterCluster(cluster.gClusterConfig, req.session.user.clusterAcl));
          });
        });
      });
    });
  }
};

/**
 * @api {delete} /api/cluster
 */
exports.removeCluster = function (req, callback) {
  let clusterCode = req.query.clusterCode;
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
    callback(null, 'delete cluster success');
  });
};

/**
 * @api {delete} /api/worker
 */
exports.removeWorker = function (req, callback) {
  let clusterCode = req.query.clusterCode || 'default';
  let ip = req.query.ip;
  req.oplog({
    clientId: req.ips.join('') || '-',
    opName: 'REMOVE_WORKER',
    opType: 'PAGE_MODEL',
    opLogLevel: 'NORMAL',
    opItem: 'WORKER',
    opItemId: ip
  });
  log.info('delete worker: ', ip, clusterCode);
  cluster.deleteWorker(ip, clusterCode, function (err) {
    if (err) {
      log.error(`delete worker: ${ip} failed:`, err);
      return callback({code: err.code || 'ERROR', message: err.message});
    }
    callback(null, 'remove worker success');
  });
};

/**
 * @api {post} /api/worker
 */
exports.addWorker = function (req, callback) {
  let ip = req.body.ip;
  let clusterCode = req.body.clusterCode || 'default';
  req.oplog({
    clientId: req.ips.join('') || '-',
    opName: 'ADD_WORKER',
    opType: 'PAGE_MODEL',
    opLogLevel: 'NORMAL',
    opItem: 'WORKER',
    opItemId: ip
  });
  log.info('add worker: ', ip, clusterCode);
  cluster.addWorker(ip, clusterCode, function (err) {
    if (err) {
      log.error(`add worker: ${ip} failed:`, err);
      return callback({code: err.code || 'ERROR', message: err.message});
    }
    callback(null, 'add worker success');
  });
};
