'use strict';
const log = require('../common/log');
const cluster = require('../model/cluster');
const config = require('../config');
const lodash = require('lodash');

/**
 * @api  /pages/
 * @param req
 * @param callback
 */

/**
 * @api  /pages
 * @param req
 * @param callback
 */

/**
 * @api  /
 * @param req
 * @param callback
 */
exports.redirect = function (req, callback) {
  return callback(null, '/pages/list', 'redirect');
};

/**
 * @api {get} /pages/*
 */
exports.pages = function (req, callback) {
  cluster.getClusterCfg(function (err) {
    if (err) {
      log.error('Get cluster config from db failed.', err);
      let e = new Error('Get cluster config from db failed.' + err.message);
      return callback(e);
    }
    let whiteList = lodash.clone(config.whiteList);
    if (req.session.user.role === 1) {
      whiteList.push(req.session.user.nickname);
    }
    callback(null, {
      tpl: 'index.html',
      data: {
        clusterCfg: JSON.stringify(cluster.gClusterConfig),
        csrfToken: req.csrfToken(),
        user: req.session.user,
        whiteList: whiteList,
        env: config.env,
        publishPage: config.publishPage
      }
    }, 'html');
  });
};

/**
 * @api {get} /login
 */
exports.login = function (req, callback) {
  if (req.session && req.session.user) {
    return callback(null, '/pages/list', 'redirect');
  } else {
    callback(null, {
      tpl: 'index.html',
      data: {
        clusterCfg: JSON.stringify(cluster.gClusterConfig),
        csrfToken: req.csrfToken(),
        user: req.session.user,
        whiteList: config.whiteList,
        publishPage: config.publishPage
      }
    }, 'html');
  }
};
