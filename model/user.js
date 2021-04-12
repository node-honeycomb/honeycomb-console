'use strict';

const log = require('../common/log');
const db = require('../common/db');
const config = require('../config');

const RoleType = {
  RoleUser: 0,
  RoleAdmin: 1
};

class User {

}

/**
 * 新建用户
 */
const INSERT_SYSTEM_USER = `INSERT INTO
    hc_console_system_user (name, password, status, role, gmt_create, gmt_modified)
  VALUES(?, ?, ?, ?, ?, ?)`;

User.addUser = function (name, pwd, status, role, callback) {
  const d = new Date();

  db.query(
    INSERT_SYSTEM_USER,
    [name, pwd, status, role, d, d],
    function (err) {
      if (err) {
        log.error('Insert new user failed:', err);

        return callback(err);
      } else {
        log.info('Add user success');
        callback();
      }
    }
  );
};

const UPDATE_SYSTEM_USER = `
  UPDATE
    hc_console_system_user
  SET status = ?, password = ?, role = ?, gmt_modified = ?
  WHERE name = ?
`;

User.updateUser = function (name, pwd, status, role, callback) {
  const d = new Date();

  db.query(
    UPDATE_SYSTEM_USER,
    [status, pwd, role, d, name],
    function (err) {
      if (err) {
        log.error('update user new user failed:', err);

        return callback(err);
      } else {
        log.info('Add user success');
        callback();
      }
    }
  );
};


const LIST_USER = `
  SELECT
    name,
    role,
    status,
    gmt_create AS gmtCreate
  FROM
    hc_console_system_user
  WHERE
    status = 1
  limit 10000
`;

User.listUser = function (cb) {
  db.query(LIST_USER, cb);
};

/**
 * 获取系统用户数
 */
User.countUser = function (cb) {
  db.query('select count(1) as count from hc_console_system_user', (err, data) => {
    if (err) {
      return cb(err);
    }
    cb(null, data[0].count);
  });
};

/**
 * 获取用户信息，根据用户 name
 */
const QUERY_SYSTEM_USER = `
  SELECT
    *
  FROM
    hc_console_system_user
  WHERE
    name = ?`;

User.getUser = function (name, callback) {
  db.query(
    QUERY_SYSTEM_USER,
    [name],
    function (err, data) {
      if (err) {
        log.error('Qeury user failed:', name, err);

        return callback(err);
      }
      if (!data.length) {
        return callback(new Error('user not found'));
      }
      callback(null, data[0]);
    }
  );
};

/**
 * 废除用户
 */
const DELETE_SYSTEM_USER = `
  UPDATE
    hc_console_system_user
  SET status = 0, gmt_modified = ?
  WHERE name = ?`;

User.deleteUser = function (name, callback) {
  const d = new Date();

  db.query(
    DELETE_SYSTEM_USER,
    [d, name],
    function (err) {
      if (err) {
        log.error('Delete user failed:', name, err);
        callback(err);
      } else {
        log.info('Delete user success', name);
        callback(null);
      }
    }
  );
};

const UPDATE_SYSTEM_USER_ROLE = `UPDATE
    hc_console_system_user
    SET role = ?
    WHERE name = ? AND status = 1`;

User.updateUserRole = function (name, role, callback) {
  db.query(
    UPDATE_SYSTEM_USER_ROLE,
    [role, name],
    function (err) {
      if (err) {
        log.error('Update user role failed:', name, role);
        callback(err);
      } else {
        log.info('Update user role success:', name, role);
        callback(null);
      }
    }
  );
};

User.RoleType = RoleType;

// TODO: 暂时放这里，后面所有初始化动作放一个文件夹中，前提是需要先改写sql初始化机制保证顺序执行
function userInit(callback) {
  callback = callback || function () {};
  if (config.defaultUser && config.defaultPassword) {
    User.countUser((err, data) => {
      if (err) {
        return callback(err);
      }
      if (data > 0) {
        return callback();
      }
      User.addUser(config.defaultUser, config.defaultPassword, 1, 1, (err) => {
        callback(err);
      });
    });
  }
}

userInit((err) => {
  if (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') {
      // TODO: sql顺序需要可控
      return setTimeout(userInit, 1000);
    }
    if (err.code === 'ER_DUP_ENTRY') {
      return;
    }
    log.error('init user error', err);
  }
});

module.exports = User;
