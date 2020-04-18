'use strict';

module.exports = {
  getCluster: {
    url: '/api/cluster/list',
    headers: {
      'x-csrf-token': window.csrfToken,
    },
    method: 'GET',
  },
  getClusterByCode: {
    url: '/service/cluster/:code',
    headers: {
      'x-csrf-token': window.csrfToken,
    },
    method: 'GET',
  },
  addCluster: {
    url: '/api/cluster/create',
    headers: {
      'x-csrf-token': window.csrfToken,
    },
    method: 'POST',
  },
  deleteCluster: {
    url: '/api/cluster/:code/delete',
    headers: {
      'x-csrf-token': window.csrfToken,
    },
    method: 'POST',
  },
};
