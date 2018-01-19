'use strict';
module.exports = {
  env: 'production',
  debug: false,
  prefix: '/',
  logs: {
    oplog: {
      level: 'INFO',
      file: '${serverRoot}/logs/honeycomb-console/oplog.%year%-%month%-%day%.log'
    }
  },
  meta: {
    // DB config
    driver: 'sqlite', // mysql, sqlite, default sqlite
    dbfile: '${serverRoot}/run/honeycomb-console.sqlite.db'
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
