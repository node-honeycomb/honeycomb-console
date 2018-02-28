'use strict';

const log = require('./log');
const path = require('path');
const config = require('../config');
const Sequelize = require('sequelize');
let sequelize = null;
switch(config.meta.driver){
  case 'mysql':
    require('./mysql');
    let database = config.meta.database;
    let username = config.meta.user || config.meta.username;
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
    break;
  case 'sqlite':
    require('./sqlite');
    let dbFilePath = path.resolve(config.meta.dbfile);
    let sqliteConnectionString = `sqlite:` + dbFilePath;
    sequelize = new Sequelize(sqliteConnectionString);
    break;
  default:
    throw new Error(`unsupport driver type for ${config.meta.driver}`);
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
    logging: config.logSqlQuery || false,
    replacements: param
  }).then((data) => {
    callback(null, data[0]);
  }).catch((err) => {
    callback(err);
  });
};
