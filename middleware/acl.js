var async = require('async');
var User = require('../model/user');
var UserACLModel = require('../model/user_acl');
var log = require('../common/log');

module.exports = function (req, res, next) {
  if (!req.session || !req.session.user) {
    let err = new Error('user not authed');
    err.statusCode = 401;
    return next(err);
  }

  let user = req.session.user;
  async.waterfall([
    function (cb) {
      UserACLModel.getUserAcl(user, (err, data) => {
        cb(err, data);
      });
    },
    function (data, cb) {
      if (!data || data.length === 0) {
        req.session.user.clusterAcl = {};
        return cb(null);
      }
      var clusterAcl = {};
      data.forEach((rowData) => {
        clusterAcl[rowData.cluster_code] = {
          id: rowData.id,
          isAdmin: rowData.role === 1,
          apps: rowData.apps ? JSON.parse(rowData.apps) : []
        };
      });
      // user.clusterAcl = clusterAcl;
      cb(null);
    }
  ], function (err) {
    if (err) {
      log.info(err);
    }
    let user  = new User();
    // acl 权限check
    //
    // TODO
    next();
  });
};
