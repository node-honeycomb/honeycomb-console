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
  envName: '本地环境',
  meta: {
    driver: 'dmdb',
    host: '47.110.254.25',
    port: 5236,
    user: 'SYSDBA',
    password: 'SYSDBA',

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
