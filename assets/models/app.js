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
  }
};
