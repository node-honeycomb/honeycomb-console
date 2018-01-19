'use strict';
module.exports = {
  env: 'dev',
  debug: true,
  logs: {
    sys: {
      level: 'DEBUG'
    },
    oplog: {
      level: 'INFO'
    }
  },
  bind: 9000,
  prefix: '/',
  middleware: {
    appAuth: {
      enable: true
    },
    webpack: {
      enable: true,
      module: 'honeypack',
      router: '/assets'
    }
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
