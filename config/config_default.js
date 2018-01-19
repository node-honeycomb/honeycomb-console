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
  port: 9000,
  prefix: '/',
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
  ignoreLogFiles: [/_app_usage_cache_\/app-usage\./, /app-usage\.{year}-{month}-{day}-{hour}\.log/, /nodejs_stdout\.log\.2\d+/]
};
