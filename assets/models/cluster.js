'use strict';

module.exports = {
  getCluster: {
    url: '/api/cluster?clusterCode=:xxx',
    headers: {
      'x-csrf-token': window.csrfToken
    },
    method: 'GET',
  },
  addCluster: {
    url: '/api/cluster',
    headers: {
      'x-csrf-token': window.csrfToken
    },
    method: 'POST'
  },
  deleteCluster: {
    url: '/api/cluster',
    headers: {
      'x-csrf-token': window.csrfToken
    },
    method: 'DELETE'
  }
};
