'use strict';
const {Pool} = require('pg');
const fs = require('fs');
const path = require('path');

const log = require('./log');
const config = require('../config');
const patch = require('../ddl/patch/postgres');

let pool;

let readyFn;
let flagReady = false;

// lazy open connection
exports.ready = async function (cb) {
  if (flagReady) {
    return cb();
  }
  readyFn = cb;

  try {
    if (!config.meta.user) {
      config.meta.user = config.meta.username;
    }

    if (!config.meta.connectionLimit) {
      config.meta.connectionLimit = 3;
    }
    pool = new Pool(config.meta);
    // exec table create process
    // TODO: export async callback function to make sure db ready before main program boot.

    let statments = fs.readFileSync(path.join(__dirname, '../ddl/ddl_postgres.sql')).toString();

    statments = statments.split(/\n\n/);

    for (let i = 0; i < statments.length; i++) {
      const st = statments[i];

      await pool.query(st);
    }
    await patch(pool);
    flagReady = true;
    readyFn && readyFn();
  } catch (err) {
    log.error('postgres ready err:', err);
    readyFn(err);
  }
};

exports.query = async function (sql, params, callback) {
  if (!callback) {
    callback = params;
    params = [];
  }
  if (!Array.isArray(params) && Object.prototype.toString.call(params) !== '[object Object]') {
    // 参数是单个值, 对应的是 mysql 中的单个位置参数绑定, pg 只接受数组
    params = [params];
  }
  try {
    const result = await pool.query(sql, params);

    callback(null, result.rows);
  } catch (err) {
    callback(err);
  }
};

exports.placeholder = function (str, idx) {
  return `$${idx}`;
};
