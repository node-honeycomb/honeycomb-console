'use strict';
const user = require('../model/user');
const utils = require('../common/utils');
const log = require('../common/log');
/**
 * @api {post} /api/user/create
 * @body
 *   name
 *   password
 */
exports.createUser = function (req, callback) {
  var curUser = req.user;
  var name = req.body.name;
  var pwd = req.body.password;
  pwd = utils.sha256(pwd);

  if (!name || !pwd) {
    return callback(new Error('username and password required'));
  }
  if (curUser.role !== user.RoleType.RoleAdmin) {
    return callback(new Error('no permission'));
  }
  user.getUser(name, (err, data) => {
    if (!data) {
      return user.addUser(name, pwd, 1, user.RoleType.RoleUser, callback);
    }
    user.updateUser(name, pwd, 1, data.role, callback);
  });
};

/**
 * @api {get} /api/user/list
 */
exports.listUser = function (req, callback) {
  user.listUser(callback);
};
/**
 * @api {post} /api/user/:name/delete
 */
exports.deleteUser = function (req, callback) {
  var uname = req.params.name;
  var curUser = req.user;
  if (curUser.role !== user.RoleType.RoleAdmin) {
    return callback(new Error('no permission'));
  }
  user.getUser(uname, (err, data) => {
    if (err) {
      return callback(err);
    }
    if (!data) {
      return callback(null);
    }
    if (data.role === user.RoleType.RoleAdmin) {
      return callback(new Error('no permission'));
    }
    user.deleteUser(uname, callback);
  });
};

/**
 * @api {get} /api/xxxx
 */
exports.xxxx = function (req, callback) {
  let user = req.user;
  callback(null, {
    name: user.name,
    role: user.role
  }, {ignoreCamel: true});
};


