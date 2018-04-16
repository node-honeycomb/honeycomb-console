'use strict';
const path = require('path');

module.exports = {
  debug: true,
  /**
   * meta db
   *   sqlite or mysql
   *
   */
  meta: {
    driver: 'sqlite', // mysql or sqlite, default sqlite
    dbfile: path.join(__dirname, '../run/meta.db')
  },
  // "meta": {
  //   "debug": ["ComQueryPacket"],
  //   "desc": "dtboost local meta db",
  //   "driver": "mysql",
  //   "host": "127.0.0.1",
  //   "port": 3306,
  //   "user": "root",
  //   "password": "888888",
  //   "database": "hc_console",
  //   "session_variables": [{
  //     "group_concat_max_len": 1048576
  //   }]
  // },
  // port: 9000,
  prefix: '/honeycomb-console',
  dumpConfig: true,
  middleware: {
    cookieSession: {
      config: {
        secret: '** change this config when publish **'
      }
    },
    appAuth: {
      enable: true,
      module: '../middleware/auth.js',
      config: {}
    },
    store: {
      enable: false,
      module: '../middleware/store.js',
      config: {}
    },
    acl: {
      enable: true,
      module: '../middleware/acl.js',
      config: {}
    },
    permission: {
      enable: true,
      module: '../middleware/permission.js',
      config: {}
    }
  },
  extension: {
    oplog: {
      module: '../extension/oplog.js',
      config: {},
      enable: true
    },
    redirect: {
      enable: true,
      /** 必填 */
      config: {
        allowDomains: []
      }
    }
  },
  whiteList: ['admin'],
  ignoreLogFiles: [/_app_usage_cache_\/app-usage\./, /app-usage\.{year}-{month}-{day}-{hour}\.log/, /nodejs_stdout\.log\.2\d+/],
  logSqlQuery: true,
  secureServerVersion: '1.0.3_3',
  oldConsole: ''
};
