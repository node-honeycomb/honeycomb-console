'use strict';
/**
 * app的主入口文件
 */
const App = require('hc-bee');
const app = new App();
const config = require('./config');
const startMonitor = require('./monitor');

app.server.setTimeout(300000);

config.username = app.config.username;
config.password = app.config.password;

const cluster = require('./model/cluster');
const db = require('./common/db');

if (db.ready) {
  db.ready(() => {
    cluster.getClusterCfg(() => {
      app.ready(true);
      if (config.autoCheck) {
        require('./auto_check');
      }
    });
  });
} else {
  cluster.getClusterCfg(() => {
    app.ready(true);
    if (config.autoCheck) {
      require('./auto_check');
    }
  });
}

startMonitor();

module.exports = app;
