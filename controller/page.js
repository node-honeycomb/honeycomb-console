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

    callback(null, {
      tpl: 'index.html',
      data: {
        clusterCfg: JSON.stringify(cluster.gClusterConfig),
        csrfToken: req.csrfToken(),
        user: req.user,
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
  if (req.user) {
    return callback(null, '/pages/list', 'redirect');
  } else {
    callback(null, {
      tpl: 'index.html',
      data: {
        clusterCfg: JSON.stringify(cluster.gClusterConfig),
        csrfToken: req.csrfToken(),
        user: req.user,
        publishPage: config.publishPage
      }
    }, 'html');
  }
};
