'use strict';

module.exports = {
  getAppsConfig: {
    url: '/api/config/:appId/get',
    method: 'GET',
    headers: {
      'x-csrf-token': window.csrfToken
    }
  },
  setAppConfig: {
    url: '/api/config/:appId/update',
    method: 'POST',
    headers: {
      'x-csrf-token': window.csrfToken
    }
  }
};
