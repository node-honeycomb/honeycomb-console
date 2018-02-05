'use strict';

module.exports = {
  deleteApps: {
    url: '/api/app:/:id/delete',
    headers: {
      'x-csrf-token': window.csrfToken
    },
    method: 'POST',
  },
  reloadApps: {
    url: '/api/app/:id/reload',
    headers: {
      'x-csrf-token': window.csrfToken
    },
    method: 'POST',
  },
  startApps: {
    url: '/api/app/:id/start',
    headers: {
      'x-csrf-token': window.csrfToken
    },
    method: 'POST',
  },
  stopApps: {
    url: '/api/app/:id/stop',
    headers: {
      'x-csrf-token': window.csrfToken
    },
    method: 'POST',
  },
  cleanAppExitRecord: {
    url: '/api/app/:id/clean_exit_record',
    headers: {
      'x-csrf-token': window.csrfToken
    },
    method: 'POST',
  },
};
