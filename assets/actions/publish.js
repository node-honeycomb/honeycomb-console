'use strict';

let _ = require('lodash');

module.exports = {
  store: {
    meta: {

    },

  },
  actions: {
    removeWorker: {
      async: true,
      reducer: {
        success: (store, action) => {
          //let oldIps = localStorage.getItem('clusterIpList');
          //localStorage.setItem('clusterIpList',clusterMeta.meta[e.key].ips.toString());
        }
      }
    },
    addWorker: {
      async: true,
      reducer: {
        success: (store, action) => {
          //let oldIps = localStorage.getItem('clusterIpList');
          store.logContent = _.get(action, 'data.success');
        }
      }
    },
  }
};
