const fs = require('xfs');
const path = require('path');
const Sqlite = require('sqlite3');
const async = require('async');

const log = require('./log');
const config = require('../config');

let readyFn = null;
let flagReady = false;

let flag;
const meta = config.meta;

if (fs.existsSync(meta.dbfile)) {
  log.info('create db');
  flag = Sqlite.OPEN_READWRITE;
} else {
  flag = Sqlite.OPEN_READWRITE | Sqlite.OPEN_CREATE;
}
fs.sync().mkdir(path.dirname(meta.dbfile));
const db = new Sqlite.Database(meta.dbfile, flag, function (err) {
  if (err) throw new Error(err);
  if (flag === (Sqlite.OPEN_READWRITE | Sqlite.OPEN_CREATE)) {
    let statments = fs.readFileSync(path.join(__dirname, '../ddl/ddl_sqlite.sql')).toString();

    statments = statments.split(/\n\n/);

    async.eachSeries(statments, (st, done) => {
      db.all(st, done);
    }, (err) => {
      if (err) {
        return log.error(err);
      }
      flagReady = true;
      if (readyFn) {
        console.log('sqllite db ready');
        readyFn();
      }
    });
  }
});

exports.query = function (sql, param, callback) {
  if (callback === undefined) {
    callback = param;
    param = [];
  }
  db.all(sql, param, callback);
};

exports.ready = function (cb) {
 if (flagReady) {
      return cb();
  }
  readyFn = cb;
}

exports.type = 'sqlite';

