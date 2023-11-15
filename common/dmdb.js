'use strict';

const dmdb = require('dmdb');
const fs = require('fs');
const path = require('path');
const {Readable} = require('stream');

const log = require('./log');
const config = require('../config');
const patch = require('../ddl/patch/dmdb');

async function getDataFromReadableStream(readableStream) {
  return new Promise(resolve => {
    let bufList = [];
    readableStream.on('data', chunk => {
      bufList.push(chunk);
    });
    function r() {
      resolve(Buffer.concat(bufList).toString());
    }
    readableStream.on('end', r);
    readableStream.on('close', r);
    readableStream.on('finish', r);
  });
}

let pool;

let readyFn;
let flagReady = false;



exports.ready = async function (cb) {
  if (flagReady) {
    return cb();
  }
  readyFn = cb;
  try {
    if (!config.meta.user) {
      config.meta.user = config.meta.username;
    }
    const {
      host,
      port,
      user,
      password,
      database,
    } = config.meta;

    pool = await dmdb.createPool({
      connectString: `dm://${user}:${password}@${host}:${port}/${database}?injectArray=true`,
    });
    const conn = await pool.getConnection();
    let statments = fs.readFileSync(path.join(__dirname, '../ddl/ddl_dmdb.sql')).toString();

    statments = statments.split(/\n\n/);
    for (const i in statments) {
      const sql = statments[i];

      console.log('init sql', sql);
      await conn.execute(sql);
    }

    await patch(conn);
    await conn.close();
    flagReady = true;
    readyFn && readyFn();
  } catch (err) {
    log.error('dmdb ready err:', err);
    readyFn(err);
  }
};

exports.query = async function (sql, params, callback) {
  if (!callback) {
    callback = params;
    params = [];
  }
  if (!Array.isArray(params) && Object.prototype.toString.call(params) !== '[object Object]') {
    // 参数是单个值, 对应的是 mysql 中的单个位置参数绑定, dmdb 只接受数组
    params = [params];
  }
  let conn;
  // dmdb 在绑定参数有数组的情况下 sql 的开头有换行或者空格会报错
  sql = sql.trim();
  try {
    conn = await pool.getConnection();
    const result = await conn.execute(sql, params);
    const rows = await dmdbResultToRows(result);
    callback(null, rows);
  } catch (err) {
    log.error('dmdb sql err:', sql, params, err);
    callback(err);
  } finally {
    conn && (await conn.close());
  }
};

async function dmdbResultToRows(result) {
  return await Promise.all((result && result.rows || []).map(async (row, idx) => {
    return await row.reduce(async (obj, cur, columnIdx) => {
      obj = await obj;
      if (cur instanceof Readable) {
        cur = await getDataFromReadableStream(cur);
      }
      obj[result.metaData[columnIdx].name] = cur;

      return obj;
    }, {});
  }));
}

const tickChar = '"';
exports.quoteIdentifier = function (identifier = '') {
  return tickChar + identifier.replace(new RegExp(tickChar, 'g'), '') + tickChar;
}