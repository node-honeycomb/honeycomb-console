'use strict';

const log = require('../common/log');
const mysql = require('../common/db');
const RoleType = {
  RoleUser: 0,
  RoleAdmin: 1
};

const INSERT_SYSTEM_USER = `INSERT INTO
    hc_console_system_user (name, password, status, role, gmt_create, gmt_modified)
  VALUES(?, ?, ?, ?, ?, ?);`;

exports.addUser = function (name, pwd, status, role, callback) {
  let d = new Date();
  mysql.query(
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

exports.countUser = function (cb) {
  mysql.query('select count(1) as count from hc_console_system_user', cb);
};

const QUERY_SYSTEM_USER = `SELECT *
  FROM hc_console_system_user
  WHERE
    name = ?;`;

exports.getUser = function (name, callback) {
  mysql.query(
    QUERY_SYSTEM_USER,
    [name],
    function (err, data) {
      if (err) {
        log.error('Qeury user failed:',  name, err);
        return callback(err);
      } else {
        callback(null, data);
      }
    }
    );
};

const DELETE_SYSTEM_USER = `UPDATE
    hc_console_system_user
  SET status = 0, gmt_modified = ?
  WHERE name = ?;`;

exports.deleteUser = function (name, callback) {
  let d = new Date();
  mysql.query(
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
    });
};

const UPDATE_SYSTEM_USER_ROLE = `UPDATE
    hc_console_system_user
    SET role = ?
    WHERE name = ? AND status = 1;`;

exports.updateUserRole = function (name, role, callback) {
  mysql.query(
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
    });
};

exports.RoleType = RoleType;
