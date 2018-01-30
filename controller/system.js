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
  if (req.session && req.session.user) {
    delete req.session.user;
  }
  res.redirect('/');
};

/**
 * @api {post} /loginAuth
 */
exports.loginAuth = function (req, callback) {
  let opt = req.body;
  if (opt.username === config.username &&
    utils.sha256(opt.password) === config.password) {
    req.session.user = {
      id: opt.username,
      name: opt.username,
      nickname: opt.username
    };
    callback(null, {code: 'SUCCESS'});
  } else {
    log.error('用户名密码错误');
    callback({code: 'ERROR', message: '用户名密码错误'});
  }
};

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
  let user = req.session.user;
  callback(null, {
    userId: user.id,
    name: user.name,
    nickname: user.nickname
  }, {ignoreCamel: true});
};
