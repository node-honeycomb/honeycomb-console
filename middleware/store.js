var async = require('async');
var UserModel = require('../model/user');
var log = require('../common/log');

module.exports = function () {
  return function (req, res, next) {
    if (req.session && req.session.user) {
      let user = req.session.user;
      async.waterfall([
        function (cb) {
          UserModel.getUser(user.name, cb);
        },
        function (data, cb) {
          if (!data || data.length === 0) {
            UserModel.addUser(user.name, 1, UserModel.RoleType.RoleUser, cb);
          } else {
            cb(null);
          }
        }
      ], function (err) {
        if (err) {
          log.error(err);
          res.end('Fail to store user info');
        } else {
          next();
        }
      });
    } else {
      next();
    }
  };
};


