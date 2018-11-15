'use strict';
module.exports = {
  getAppList: {
    url: '/api/app/list',
    method: 'GET',
    headers: {
      'x-csrf-token': window.csrfToken
    }
  },
  getStatus: {
    url: '/api/status',
    method: 'GET',
    headers: {
      'x-csrf-token': window.csrfToken
    }
  },
  publishApp: {
    url: '/api/app/publish',
    method: 'POST',
    headers: {
      'x-csrf-token': window.csrfToken
    }
  },
  getCoredump: {
    url: '/api/coredump',
    method: 'GET',
    headers: {
      'x-csrf-token': window.csrfToken
    }
  },
  getUnknowProcess: {
    url: '/api/unknowProcess',
    method: 'GET',
    headers: {
      'x-csrf-token': window.csrfToken
    }
  },
  deleteCoredump: {
    url: '/api/coredump/delete',
    method: 'POST',
    headers: {
      'x-csrf-token': window.csrfToken
    }
  },
  deleteUnknowProcess: {
    url: '/api/unknowProcess/:pid/delete',
    method: 'POST',
    headers: {
      'x-csrf-token': window.csrfToken
    }
  }
};
