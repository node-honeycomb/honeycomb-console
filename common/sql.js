const fs = require('xfs');
const SQLJS = require('sql.js');
const path = require('path');
const async = require('async');
const sqlString = require('sqlstring');

const log = require('./log');
const config = require('../config');

const dbfile = config.meta.dbfile;
const buf = fs.existsSync(dbfile) ? fs.readFileSync(dbfile) : undefined;
let db;
let readyFn = null;
let flagReady = false;

// eslint-disable-next-line
SQLJS().then((SQL) => {
  db = new SQL.Database(buf);
  let statments = fs.readFileSync(path.join(__dirname, '../ddl/ddl_sqlite.sql')).toString();

  statments = statments.split(/\n\n/);
  let flag = false;

  async.eachSeries(statments, (st, done) => {
    try {
      db.exec(st);
    } catch (e) {
      if (e && /^(alter|rename)/ig.test(st)) {
        // do nothing
      } else {
        throw e;
      }
    }
    flag = flag || /^(insert|delete|update|create|alter)/i.test(st.trim());
    done();
  }, (err) => {
    if (err) {
      return log.error(err);
    }
    if (flag) {
      console.log('save db init');
      fs.sync().save(dbfile, new Buffer(db.export()));
    }
    flagReady = true;
    if (readyFn) {
      console.log('sql.js db ready');
      readyFn();
    }
  });
});

function transfer(data) {
  data = data[0];
  if (!data) {
    return [];
  }
  const res = [];
  const columns = data.columns;
  const rows = data.values;

  rows.forEach((row) => {
    const obj = {};

    columns.forEach((key, i) => {
      obj[key] = row[i];
    });
    res.push(obj);
  });

  return res;
}

function prepareSql(sql, param) {
  sql = sqlString.format(sql, param);
  // 因为sql.js的存储没有直接落地文件，需要对双引号做一次引号转移
  sql = sql.replace(/\\"/g, '"');

  return sql;
}

exports.query = function (sql, param, cb) {
  if (cb === undefined) {
    cb = param;
    param = [];
  }
  const flag = /^(insert|delete|update|create|alter)/i.test(sql.trim());

  // console.log('>>> query:', sql, param);
  sql = prepareSql(sql, param);
  // console.log('>>> sql:', sql);

  let res;

  try {
    res = transfer(db.exec(sql));
  } catch (e) {
    return cb(e);
  }
  // console.log('>>> res:', JSON.stringify(res, null, 2));
  if (flag) {
    // console.log('save to file');
    fs.sync().save(dbfile, new Buffer(db.export()));
  }
  cb && cb(null, res);
};

exports.ready = function (cb) {
  if (flagReady) {
    return cb();
  }
  readyFn = cb;
};

exports.type = 'sqlite';
