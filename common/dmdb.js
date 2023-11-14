'use strict';

const dmdb = require('dmdb');
const fs = require('fs');
const path = require('path');
const {Readable} = require('stream');

const log = require('./log');
const config = require('../config');
const patch = require('../ddl/patch/dmdb');

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
      connectString: `dm://${user}:${password}@${host}:${port}/${database}`,
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
    params = {};
  }
  try {
    const conn = await pool.getConnection();
    const result = await conn.execute(sql, params);
    const rows = await dmdbResultToRows(result);

    callback(null, rows);
  } catch (err) {
    log.error('dmdb sql err:', sql, err);
    callback(err);
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
