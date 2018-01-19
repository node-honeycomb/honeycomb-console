'use strict';

module.exports = {
  queryAppUsages: {
    url: '/api/appUsages',
    headers: {
      'x-csrf-token': window.csrfToken
    },
    method: 'GET'
  }
};
