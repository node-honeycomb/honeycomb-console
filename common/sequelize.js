'use strict';

const log = require('./log');
const path = require('path');
const config = require('../config');
const Sequelize = require('sequelize');
let sequelize = null;

if (config.meta.driver === 'mysql') {
  let database = config.meta.database;
  let username = config.meta.username;
  let password = config.meta.password;
  let host = config.meta.host;
  let dialect = 'mysql';
  let port = config.meta.port;

  sequelize = new Sequelize(database, username, password, {
    host,
    port,
    dialect,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else if (config.meta.driver === 'sqlite') {
  let dbFilePath = path.resolve(config.meta.dbfile);
  let sqliteConnectionString = `sqlite:` + dbFilePath;
  sequelize = new Sequelize(sqliteConnectionString);
}

sequelize.authenticate().then(() => {
  log.info('Connection has been established successfully.');
}).catch(err => {
  log.error('Unable to connect to the database:', err);
});


module.exports.query = function (sql, ...args) {
  let param = [];
  let callback = null;
  if (args.length === 2) {
    param = args[0];
    callback = args[1];
  } else {
    callback = args[0];
  }
  sequelize.query(sql, {
    replacements: param
  }).then((data) => {
    callback(null, data[0]);
  }).catch((err) => {
    callback(err);
  });
};
