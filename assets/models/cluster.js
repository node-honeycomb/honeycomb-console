'use strict';

module.exports = {
  getCluster: {
    url: '/api/cluster/list',
    headers: {
      'x-csrf-token': window.csrfToken
    },
    method: 'GET',
  },
  addCluster: {
    url: '/api/cluster/create',
    headers: {
      'x-csrf-token': window.csrfToken
    },
    method: 'POST'
  },
  deleteCluster: {
    url: '/api/cluster/:id/delete',
    headers: {
      'x-csrf-token': window.csrfToken
    },
    method: 'POST'
  }
};
