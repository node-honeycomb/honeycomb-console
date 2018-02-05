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
  }
};
