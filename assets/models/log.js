'use strict';

module.exports = {
  loadLogFiles: {
    url: '/api/log/list',
    method: 'GET',
    headers: {
      'x-csrf-token': window.csrfToken
    }
  },
  queryLog: {
    url: '/api/log?fileName=:fileName',
    method: 'GET',
    contentType: 'application/json; charset=utf-8',
    headers: {
      'x-csrf-token': window.csrfToken
    }
  }
};
