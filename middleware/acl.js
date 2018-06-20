var async = require('async');
var User = require('../model/user');
var UserACLModel = require('../model/user_acl');
var log = require('../common/log');

class UserClass {
  constructor(user) {
    this.id = user.id;
    this.role = user.role;
    this.name = user.name;
    this.clusterAcl = user.clusterAcl;
  }
  isSystemAdmin() {
    return this.role === 1;
  }
  isClusterAdmin(clusterCode) {
    return this.isSystemAdmin() || this.clusterAcl[clusterCode] && this.clusterAcl[clusterCode].isAdmin;
  }
  containsCluster(clusterCode) {
    return this.isClusterAdmin(clusterCode) || !!this.clusterAcl[clusterCode];
  }
  containsApp(clusterCode, appName) {
    return this.isSystemAdmin() || this.isClusterAdmin(clusterCode) || ['server', 'common'].indexOf(appName) === -1 && this.clusterAcl[clusterCode] && (this.clusterAcl[clusterCode].apps.indexOf('*') > -1 || this.clusterAcl[clusterCode].apps.indexOf(appName) > -1);
  }
  getAdminClusterList() {
    return Object.keys(this.clusterAcl).map((clusterCode) => {
      return this.clusterAcl[clusterCode].isAdmin ? clusterCode: '';
    }).filter((clusterCode) => {
      return !!clusterCode;
    });
  }
}

module.exports = function (req, res, next) {
  if (req.session && req.session.username) {
    var username = req.session.username;
    var user = {};
    user.name = username;
    async.waterfall([
      function (cb) {
        User.getUser(username, cb);
      },
      function (data, cb) {
        if (!data) {
          return cb(null);
        }
        user.id = data.id;
        user.role = data.role;
        UserACLModel.getUserAcl(user, cb);
      },
      function (data, cb) {
        if (!data || data.length === 0) {
          user.clusterAcl = {};
        } else {
          let clusterAcl = {};
          data.forEach((rowData) => {
            clusterAcl[rowData.cluster_code] = {
              id: rowData.id,
              name: rowData.cluster_name,
              isAdmin: rowData.cluster_admin,
              apps: rowData.apps ? JSON.parse(rowData.apps) : []
            };
          });
          user.clusterAcl = clusterAcl;
        }
        req.user = new UserClass(user);
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
