'use strict';

module.exports = {
  getAppList: {
    url: '/api/apps',
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
