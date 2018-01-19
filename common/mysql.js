'use strict';
const mysql = require('mysql');
const log = require('./log');
const config = require('../config');

if (!config.meta.connectionLimit) config.meta.connectionLimit = 3;

const pool = mysql.createPool(config.meta);

if (config.meta.session_variables) {
  log.debug(mysql.format('SET SESSION ?', config.meta.session_variables));
  for (let i = 0; i < config.meta.connectionLimit; i++) {
    pool.getConnection(function (err, conn) {
      if (err) {
        return log.error(err);
      }
      conn.query('SET SESSION ?', config.meta.session_variables, function () {
        conn.release();
      });
    });
  }
}

exports.query = function (sql, param, callback) {
  pool.query(sql, param, callback);
};
