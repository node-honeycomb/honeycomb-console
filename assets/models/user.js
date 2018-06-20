'use strict';

module.exports = {
  listUser: {
    url: '/api/user/list',
    method: 'GET',
    headers: {
      'x-csrf-token': window.csrfToken
    }
  },
  createUser: {
    url: '/api/user/create',
    method: 'POST',
    headers: {
      'x-csrf-token': window.csrfToken
    }
  },
  deleteUser: {
    url: '/api/user/:name/delete',
    method: 'POST',
    headers: {
      'x-csrf-token': window.csrfToken
    }
  }
};
