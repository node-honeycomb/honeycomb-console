const config = require('../config');
const log = require('./log');
const meta = config.meta;
const path = require('path');
const Sqlite = require('sqlite3');
const utils = require('../common/utils');
const fs = require('xfs');
const async = require('async');

let flag;
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
      /*
      let sql = `INSERT INTO hc_console_system_user(name, password, status, role, gmt_create, gmt_modified) VALUES (?, ?, ?, ?, ?, ?);`;
      let data = [
        'admin',
        utils.sha256(config.initPwd + config.pwdSalt),
        1,
        1,
        new Date(),
        new Date()
      ];
      db.all(sql, data, (err, data) => {
        if (err) {
          log.error('init admin user err:', err);
        }
      });
      */
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

