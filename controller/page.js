'use strict';
const qs = require('qs');
const path = require('path');

const config = require('../config');
const log = require('../common/log');
const cluster = require('../model/cluster');

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
  let query = qs.stringify(req.query);

  if (query) {
    query = '?' + query;
  }

  return callback(null, path.join(config.prefix, '/pages/list' + query), 'redirect');
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
        prefix: config.prefix !== '/' ? config.prefix : '',
        secureServerVersion: config.secureServerVersion || '0.0.0',
        oldConsole: config.oldConsole || '',
        clusterCfg: JSON.stringify(cluster.gClusterConfig),
        csrfToken: req.csrfToken(),
        user: req.user,
        appManageConfig: config.appManageConfig,
        env: config.env,
        publishPages: Array.isArray(config.publishPages) ? config.publishPages : [],
        hideUpload: config.hideUpload,
        newConsole: config.newConsole || ''
      }
    }, 'html');
  });
};

/**
 * @api {get} /login
 */
exports.login = function (req, callback) {
  if (req.user) {
    return callback(null, path.join(config.prefix, '/pages/list'), 'redirect');
  } else {
    callback(null, {
      tpl: 'index.html',
      data: {
        prefix: config.prefix !== '/' ? config.prefix : '',
        clusterCfg: JSON.stringify(cluster.gClusterConfig),
        csrfToken: req.csrfToken(),
        user: req.user,
        publishPage: config.publishPage,
      }
    }, 'html');
  }
};
