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
    driver: 'sql.js', // mysql or sql.js, default sql.js
    dbfile: path.join(__dirname, '../run/meta.db')
  },
  // 初始化默认用户名和密码，都为空是才初始化，否则不初始化，密码为明文sha256加密后的字串
  defaultUser: '',
  defaultPassword: '',
  registerSecret: 'hc-console',
  /**
   * 初始化集群信息, 结构是一个对象，key是cluster的code和name, value是一个字符串用逗号隔开，对应集群中的ip
   * 例如 cluster: {dtboost: '127.0.0.1,127.0.0.2'}
   */
  cluster: {},
  // cluster的默认token
  clusterToken: '***honeycomb-default-token***',
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
  oldConsole: '',
  appManageConfig: {
    keepOnlineNum: 2,
    keepOfflineNum: 5
  }
};
