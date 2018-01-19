'use strict';

module.exports = {
  loginAuth: {
    url: '/loginAuth',
    method: 'POST',
    headers: {
      'x-csrf-token': window.csrfToken
    }
  },
};
