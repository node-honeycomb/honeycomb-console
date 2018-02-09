'use strict';

module.exports = {
  deleteApps: {
    url: '/api/app/:appId/delete',
    headers: {
      'x-csrf-token': window.csrfToken
    },
    method: 'POST',
  },
  reloadApps: {
    url: '/api/app/:appId/reload',
    headers: {
      'x-csrf-token': window.csrfToken
    },
    method: 'POST',
  },
  startApps: {
    url: '/api/app/:appId/start',
    headers: {
      'x-csrf-token': window.csrfToken
    },
    method: 'POST',
  },
  stopApps: {
    url: '/api/app/:appId/stop',
    headers: {
      'x-csrf-token': window.csrfToken
    },
    method: 'POST',
  },
  cleanAppExitRecord: {
    url: '/api/app/:appId/clean_exit_record',
    headers: {
      'x-csrf-token': window.csrfToken
    },
    method: 'POST',
  },
};
