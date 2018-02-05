'use strict';

module.exports = {
  getAppsConfig: {
    url: '/api/config/:id/get',
    method: 'GET',
    headers: {
      'x-csrf-token': window.csrfToken
    }
  },
  setAppConfig: {
    url: '/api/config/:app/update',
    method: 'POST',
    headers: {
      'x-csrf-token': window.csrfToken
    }
  }
};
