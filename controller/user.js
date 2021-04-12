const user = require('../model/user');
const utils = require('../common/utils');
const {ECODE, EMSG} = require('../common/error');

/**
 * 创建一个用户
 * @api {post} /api/user/create
 * @body
 *   name {String} 用户名
 *   password {String} 密码
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
    return callback({
      code: ECODE.NO_PERMISSION,
      message: EMSG.NO_PERMISSION
    });
  }

  user.getUser(name, (err, data) => {
    if (!data) {
      return user.addUser(name, pwd, 1, user.RoleType.RoleUser, callback);
    }
    user.updateUser(name, pwd, 1, data.role, callback);
  });
};

/**
 * 获取用户列表
 * @api {get} /api/user/list
 */
exports.listUser = function (req, callback) {
  user.listUser(callback);
};
/**
 * 删除一个用户
 * @api {post} /api/user/:name/delete
 */
exports.deleteUser = function (req, callback) {
  var uname = req.params.name;
  var curUser = req.user;

  if (curUser.role !== user.RoleType.RoleAdmin) {
    return callback({
      code: ECODE.NO_PERMISSION,
      message: EMSG.NO_PERMISSION
    });
  }

  user.getUser(uname, (err, data) => {
    if (err) {
      return callback(err);
    }

    if (!data) {
      return callback(null);
    }

    if (data.role === user.RoleType.RoleAdmin) {
      return callback({
        code: ECODE.NO_PERMISSION,
        message: EMSG.NO_PERMISSION
      });
    }

    user.deleteUser(uname, callback);
  });
};


