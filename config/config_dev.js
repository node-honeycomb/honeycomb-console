'use strict';
module.exports = {
  env: 'dev',
  debug: true,
  dumpConfig: true,
  logs: {
    sys: {
      level: 'DEBUG'
    },
    oplog: {
      level: 'INFO'
    }
  },
  meta: {
    /*
    driver: 'mysql', // mysql or sql.js, default sql.js
    host     : '127.0.0.1',
    user     : 'root',
    password : '12345678',
    database : 'honeycomb-console'
    */
  },
  port: 9000,
  middleware: {
    appAuth: {
      enable: true
    },
  },
  extension: {
    redirect: {
      config: {
        allowDomains: []
      }
    },
    oplog: {
      enable: true
    }
  }
};
