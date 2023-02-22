/**
 * app的主入口文件
 */
const App = require('hc-bee');
const app = new App();

const config = require('./config');

app.server.setTimeout(300000);

config.username = app.config.username;
config.password = app.config.password;

const model = require('./model');
const db = require('./common/db');

if (db.ready) {
  app.onConfigReady((done) => {
    function readyFn() {
      db.ready(() => {
        model.init(() => {
          app.ready(true);
        });
      });
      done();
    }
    readyFn();
  });
} else {
  model.init(() => {
    app.ready(true);
    /*
    if (config.autoCheck) {
      require('./auto_check');
    }
    */
  });
}

if (config.monitor && config.monitor.enable) {
  require('./monitor')();
}

module.exports = app;
