'use strict';
module.exports = {
  env: 'production',
  debug: false,
  registerSecret: '', // close register by default
  logs: {
    oplog: {
      level: 'INFO',
      file: '${serverRoot}/logs/honeycomb-console/oplog.%year%-%month%-%day%.log'
    }
  },
  meta: {
    // DB config
    driver: 'mysql' // mysql, sql.js, default sqlite
  },
  middleware: {
    cookieSession: {
      config: {
        secret: '** change this config when publish **'
      }
    }
  },
  extension: {
    redirect: {
      config: {
        allowDomains: []
      }
    }
  }
};
