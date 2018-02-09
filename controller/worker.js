
'use strict';
const async = require('async');
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