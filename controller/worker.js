
'use strict';
const async = require('async');
const config = require('../config');
const log = require('../common/log');
const cluster = require('../model/cluster');
const userAcl = require('../model/user_acl');

/**
 * @api {post} /api/worker/:id/delete
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
 * @api {post} /api/worker/create
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

/**
 * @api {post} /api/worker/register
 * @query
 *    ip !
 *    code !
 *    token ?
 *    endpoint ?
 *    secret !
 *    
 */
exports.registerWorker = function (req, callback) {
  let ip = req.body.ip;
  let code = req.body.cluster;
  let name = code;
  let token = req.body.token || config.clusterToken;
  let endpoint = req.body.endpoint || `http://${ip}:9999`;
  let secret = req.headers.authorization;

  if (!ip || !code || !secret) {
    return callback(new Error('param missing, ip/code/secret needed'));
  }

  if (config.registerSecret !== secret) {
    return callback(new Error('register error, auth failed'));
  }

  req.oplog({
    clientId: req.ips.join('') || '-',
    opName: 'REGISTER_WORKER',
    opType: 'PAGE_MODEL',
    opLogLevel: 'NORMAL',
    opItem: 'WORKER',
    opItemId: ip
  });
  log.info('register worker: ', ip, code);

  cluster.addCluster(name, code, token, endpoint, (err) => {
    if (err && !/unique|duplicate/i.test(err.message)) {
      return callback(err);
    }
    cluster.updateCluster(name, code, token, endpoint, (err) => {
      if (err) {
        return callback(err);
      }
      cluster.addWorker(ip, code, (err) => {
        if (err && !/unique|duplicate/i.test(err.message)) {
          log.error(`register worker: ${ip} failed:`, err.message);
          return callback({code: err.code || 'ERROR', message: err.message});
        }
        callback(null, 'register worker success');
      });
    });
  });
  /*
  cluster.addTmpWorker(ip, clusterCode, function (err) {
    if (err) {
      log.error(`add worker: ${ip} failed:`, err);
      return callback({code: err.code || 'ERROR', message: err.message});
    }
    callback(null, 'register tmp worker success');
  });
  */
};


/**
 * @api {post} /api/worker/unregister/:id
 */
exports.unregisterWorker = function (req, callback) {
  let ip = req.params.id;
  req.oplog({
    clientId: req.ips.join('') || '-',
    opName: 'DEL_TMP_WORKER',
    opType: 'PAGE_MODEL',
    opLogLevel: 'NORMAL',
    opItem: 'WORKER',
    opItemId: ip
  });
  log.info('delete tmp worker: ', ip, clusterCode);
  cluster.deleteTmpWorker(id, function (err) {
    if (err) {
      log.error(`delete tmp worker: ${ip} failed:`, err);
      return callback({code: err.code || 'ERROR', message: err.message});
    }
    callback(null, 'del tmp worker success');
  });
};

/**
 * @api {get} /api/worker/listAll
 */
exports.listAllWorker = function (req, callback) {
  req.oplog({
    opName: 'LIST_WORKER',
    opType: 'PAGE_MODEL',
    opLogLevel: 'NORMAL',
    opItem: 'WORKER',
  });
  cluster.queryAllWorker((err, workers) => {
    if (err) {
      log.error('query all workers failed:', err);
      return callback({code: err.code || 'ERROR', message: err.message});
    }
    callback(null, workers);
  });
};

/**
 * @api {post} /api/worker/deleteByIp
 */
exports.deleteWorkerByIp = function (req, callback) {
  const {ip} = req.body;
  req.oplog({
    clientId: req.ips.join('') || '-',
    opName: 'DEL_WORKER',
    opType: 'PAGE_MODEL',
    opLogLevel: 'NORMAL',
    opItem: 'WORKER',
    opItemId: ip
  });
  log.info('delete worker: ', ip);
  cluster.deleteWorkerByIp(ip, function (err) {
    if (err) {
      log.error(`delete worker: ${ip} failed:`, err);
      return callback({code: err.code || 'ERROR', message: err.message});
    }
    callback(null, 'del worker success');
  });
};
