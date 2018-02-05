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
    url: '/api/acl/:id/get',
    method: 'GET',
    headers: {
      'x-csrf-token': window.csrfToken
    }
  },
  updateAcl: {
    url: '/api/acl/:id/update',
    method: 'POST',
    headers: {
      'x-csrf-token': window.csrfToken
    }
  },
  deleteAcl: {
    url: '/api/acl/:id/delete',
    method: 'POST',
    headers: {
      'x-csrf-token': window.csrfToken
    }
  },
  // getAppList: {
  //   url: '/api/getAppList',
  //   method: 'POST',
  //   headers: {
  //     'x-csrf-token': window.csrfToken
  //   }
  // }
};
