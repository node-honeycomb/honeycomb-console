const SQLJS = require('sql.js');
const config = require('../config');
const path = require('path');
const async = require('async');
const fs = require('xfs');
const sqlString = require('sqlstring');
const dbfile = config.meta.dbfile;
const buf = fs.existsSync(dbfile) ? fs.readFileSync(dbfile) : undefined;
let db;
let readyFn = null;
let flagReady = false;

SQLJS().then((SQL) => {
  db = new SQL.Database(buf);
  let statments = fs.readFileSync(path.join(__dirname, '../ddl/ddl_sqlite.sql')).toString();
  statments = statments.split(/\n\n/);
  async.eachSeries(statments, (st, done) => {
    let res = db.exec(st);
    done();
  }, (err) => {
    if (err) {
      return log.error(err);
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
    let res = [];
    let columns = data.columns;
    let rows = data.values;
    rows.forEach((row) => {
        let obj = {};
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
    let flag = /^(insert|delete|update|create)/i.test(sql.trim());
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
