 'use strict';

module.exports = {
  deleteApps: {
    url: '/api/delete/:appkey',
    headers: {
      'x-csrf-token': window.csrfToken
    },
    method: 'POST',
  },
  reloadApps: {
    url: '/api/reload/:appkey',
    headers: {
      'x-csrf-token': window.csrfToken
    },
    method: 'POST',
  },
  startApps: {
    url: '/api/start/:appkey',
    headers: {
      'x-csrf-token': window.csrfToken
    },
    method: 'POST',
  },
  stopApps: {
    url: '/api/stop/:appkey',
    headers: {
      'x-csrf-token': window.csrfToken
    },
    method: 'POST',
  },
  cleanAppExitRecord: {
    url: '/api/clean_exit_record/:appid',
    headers: {
      'x-csrf-token': window.csrfToken
    },
    method: 'DELETE',
  },
};
