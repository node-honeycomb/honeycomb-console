'use strict';

module.exports = {
  getAppsConfig: {
    url: '/api/config/:type/:app',
    method: 'GET',
    headers: {
      'x-csrf-token': window.csrfToken
    }
  },
  setAppConfig: {
    url: '/api/config/:type/:app',
    method: 'POST',
    headers: {
      'x-csrf-token': window.csrfToken
    }
  }
};
