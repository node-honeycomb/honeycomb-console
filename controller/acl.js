'use strict';
const userAcl = require('../model/user_acl');
const async = require('async');
const log = require('../common/log');
/**
 * @api {post} /api/acl/create
 */
exports.createAcl = function (req, callback) {
  var user = req.user;
  var name = req.body.name;
  var clusterId = req.body.cluster_id;
  var clusterCode = req.body.cluster_code;
  var clusterName = req.body.cluster_name;
  var clusterAdmin = req.body.cluster_admin;
  var apps = req.body.apps;

  async.waterfall([
    function (cb) {
      userAcl.addUserAcl(name, clusterId, clusterCode, clusterName, clusterAdmin, apps, cb);
    }
  ], function (err) {
    log.warn('createAcl', user, req.body);
    log.error(err);
    if (err) {
      callback({code: 'ERROR', message: '添加权限异常'});
    } else {
      callback();
    }
  });
};

/**
 * @api {get} /api/acl/list
 * @param req
 * @param res
 */
exports.getAcl = function (req, callback) {
  var user = req.user;
  userAcl.getClusterAcl(user, callback);
};

/**
 * @api {post} /api/acl/:id/update
 * @param req
 * @param res
 */
exports.updateAcl = function (req, callback) {
  var acl = req.body.acl;
  userAcl.updateClusterAcl(acl, callback);
};

/**
 * @api {post} /api/acl/:id/delete
 * @param req
 * @param res
 */
exports.deleteAcl = function (req, callback) {
  var acl = req.body.acl;
  userAcl.deleteClusterAcl(acl, callback);
};


