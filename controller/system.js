'use strict';
const config = require('../config');
const log = require('../common/log');
const utils = require('../common/utils');
const cluster = require('../model/cluster');

const callremote = utils.callremote;

/**
 * @api /logout
 * @nowrap
 */
exports.logout = function (req, res) {
  if (req.session && req.session.username) {
    delete req.session.username;
  }
  res.redirect('/');
};

// /**
//  * @api {post} /loginAuth
//  */
// exports.loginAuth = function (req, callback) {
//   let opt = req.body;
//   if (opt.username === config.username &&
//     utils.sha256(opt.password) === config.password) {
//     req.session.user = {
//       id: opt.username,
//       name: opt.username,
//       nickname: opt.username
//     };
//     callback(null, {code: 'SUCCESS'});
//   } else {
//     log.error('用户名密码错误');
//     callback({code: 'ERROR', message: '用户名密码错误'});
//   }
// };

/**
 * @api {get} /api/status
 */
exports.status = function (req, callback) {
  let clusterCode = req.query.clusterCode;
  let opt = cluster.getClusterCfgByCode(clusterCode);
  if (opt.code === 'ERROR') {
    return callback(opt);
  }
  let path = '/api/status';
  callremote(path, opt, function (err, results) {
    if (err || results.code !== 'SUCCESS') {
      let errMsg = err && err.message || results.message;
      log.error('get status info failed: ', errMsg);
      let code = err && err.code || (results && results.code) || 'ERROR';
      return callback({
        code: code,
        message: errMsg
      });
    } else {
      log.debug('get status results:', results);
      return callback(null, results.data);
    }
  });
};

/**
 * @api {get} /api/user
 */
exports.getUser = function (req, callback) {
  let user = req.user;
  callback(null, {
    name: user.name,
    role: user.role
  }, {ignoreCamel: true});
};

/**
 * @api {get} /api/coredump
 */
exports.coredump = function (req, callback) {
  let clusterCode = req.query.clusterCode;
  let opt = cluster.getClusterCfgByCode(clusterCode);
  if (opt.code === 'ERROR') {
    return callback(opt);
  }
  let path = '/api/coredump';
  callremote(path, opt, function (err, results) {
    if (err || results.code !== 'SUCCESS') {
      let errMsg = err && err.message || results.message;
      log.error('get coredump info failed: ', errMsg);
      let code = err && err.code || (results && results.code) || 'ERROR';
      return callback({
        code: code,
        message: errMsg
      });
    } else {
      log.debug('get coredump results:', results);
      return callback(null, results.data);
    }
  });
};

/**
 * @api {post} /api/coredump/delete
 * @param req
 * @param callback
 */
exports.deleteCoredump = function (req, callback) {
  let files = req.body && req.body.files;
  req.oplog({
    clientId: req.ips.join('') || '-',
    opName: 'DELETE_COREDUMP',
    opType: 'PAGE_MODEL',
    opLogLevel: 'RISKY', // HIGH_RISK / RISKY / LIMIT / NORMAL http://twiki.corp.taobao.com/bin/view/SRE/Taobao_Security/DataSecPolicy
    opItem: 'SYSTEM',
  });
  let clusterCode = req.body.clusterCode;
  let opt = cluster.getClusterCfgByCode(clusterCode);
  if (opt.code === 'ERROR') {
    return callback(opt);
  }
  let path = `/api/coredump`;
  opt.method = 'DELETE';
  opt.data = {files};
  callremote(path, opt, function (err, results) {
    if (err || results.code !== 'SUCCESS') {
      let errMsg = err && err.message || results.message;
      log.error(`delete coredump files failed: `, errMsg);
      let code = (err && err.code) || (results && results.code) || 'ERROR';
      return callback({
        code: code,
        message: errMsg
      });
    } else {
      log.debug(`delete coredump files results:`, results);
      return callback(null, results.data);
    }
  });
};


/**
 * @api {get} /api/unknowProcess
 */
exports.unknowProcess = function (req, callback) {
  let clusterCode = req.query.clusterCode;
  let opt = cluster.getClusterCfgByCode(clusterCode);
  if (opt.code === 'ERROR') {
    return callback(opt);
  }
  let path = '/api/unknowProcess';
  callremote(path, opt, function (err, results) {
    if (err || results.code !== 'SUCCESS') {
      let errMsg = err && err.message || results.message;
      log.error('get unknowProcess info failed: ', errMsg);
      let code = err && err.code || (results && results.code) || 'ERROR';
      return callback({
        code: code,
        message: errMsg
      });
    } else {
      log.debug('get unknowProcess results:', results);
      return callback(null, results.data);
    }
  });
};

/**
 * @api {post} /api/unknowProcess/:pid
 * @param req
 * @param callback
 */
exports.deleteApp = function (req, callback) {
  let pid = req.params && req.params.pid;
  req.oplog({
    clientId: req.ips.join('') || '-',
    opName: 'DELETE_UNKNOWPROCESS',
    opType: 'PAGE_MODEL',
    opLogLevel: 'RISKY', // HIGH_RISK / RISKY / LIMIT / NORMAL http://twiki.corp.taobao.com/bin/view/SRE/Taobao_Security/DataSecPolicy
    opItem: 'SYSTEM',
    opItemId: pid
  });
  let clusterCode = req.body.clusterCode;
  let opt = cluster.getClusterCfgByCode(clusterCode);
  if (opt.code === 'ERROR') {
    return callback(opt);
  }
  let path = `/api/unknowProcess/${pid}`;
  opt.method = 'DELETE';
  callremote(path, opt, function (err, results) {
    if (err || results.code !== 'SUCCESS') {
      let errMsg = err && err.message || results.message;
      log.error(`delete unknownProcess ${pid} failed: `, errMsg);
      let code = (err && err.code) || (results && results.code) || 'ERROR';
      return callback({
        code: code,
        message: errMsg
      });
    } else {
      log.debug(`delete unknownProcess ${pid} results:`, results);
      return callback(null, results.data);
    }
  });
};
