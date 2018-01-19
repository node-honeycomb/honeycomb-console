'use strict';

module.exports = {
  createAcl: {
    url: '/api/createAcl',
    method: 'POST',
    headers: {
      'x-csrf-token': window.csrfToken
    }
  },
  getAcl: {
    url: '/api/getAcl',
    method: 'POST',
    headers: {
      'x-csrf-token': window.csrfToken
    }
  },
  updateAcl: {
    url: '/api/updateAcl',
    method: 'POST',
    headers: {
      'x-csrf-token': window.csrfToken
    }
  },
  deleteAcl: {
    url: '/api/deleteAcl',
    method: 'POST',
    headers: {
      'x-csrf-token': window.csrfToken
    }
  },
  getAppList: {
    url: '/api/getAppList',
    method: 'POST',
    headers: {
      'x-csrf-token': window.csrfToken
    }
  }
};
