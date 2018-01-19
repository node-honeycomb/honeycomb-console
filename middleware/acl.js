var async = require('async');
var UserModel = require('../model/user');
var UserACLModel = require('../model/user_acl');
var log = require('../common/log');

module.exports = function (req, res, next) {
  if (req.session && req.session.user) {
    var user = req.session.user;
    async.waterfall([
      function (cb) {
        UserModel.getUser(user.name, cb);
      },
      function (data, cb) {
        if (!data || data.length === 0) {
          return cb(null);
        }
        user.role = data[0].role;
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
            name: rowData.cluster_name,
            isAdmin: rowData.cluster_admin,
            apps: rowData.apps ? JSON.parse(rowData.apps) : ''
          };
        });
        req.session.user.clusterAcl = clusterAcl;
        cb(null);
      }
    ], function (err) {
      if (err) {
        log.info(err);
      }
      next();
    });
  } else {
    next();
  }
};
