'use strict';

module.exports = {
  removeWorker: {
    url: '/api/worker',
    method: 'DELETE',
    headers: {
      'x-csrf-token': window.csrfToken
    }
  },
  addWorker: {
    url: '/api/worker',
    method: 'POST',
    headers: {
      'x-csrf-token': window.csrfToken
    }
  },
  publishApp: {
    url: '/api/publish',
    method: 'POST',
    headers: {
      'x-csrf-token': window.csrfToken
    }
  }
};
