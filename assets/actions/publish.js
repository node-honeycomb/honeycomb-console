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
        }
      }
    },
    addWorker: {
      async: true,
      reducer: {
        success: (store, action) => {
          store.logContent = _.get(action, 'data.success');
        }
      }
    },
  }
};
