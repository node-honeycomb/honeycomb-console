'use strict';

module.exports = {
  debug: true,
  logs: {
    sys: {
      level: 'DEBUG'
    }
  },
  bind: 9000,
  prefix: '/',
  middleware: {
    cookieSession: {
      enable: true,
      config: {
        secret: 'xxxx'
      }
    },
    csrf: {
      enable: false
    },
    mockAuth: {
      enable: true,
      module: '../tests/mock_auth.js',
      config: {}
    },
    appAuth: {
      enable: false,
      module: '../middleware/auth.js',
      config: {}
    }
  },
  extension: {
    redirect: {
      config: {
        allowDomains: [
        ]
      }
    }
  }
};
