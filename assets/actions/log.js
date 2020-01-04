'use strict';

let _ = require('lodash');

module.exports = {
  store: {
    meta: {

    },
    logFile: [],
    logContent:[]
  },
  actions: {
    loadLogFiles: {
      async: true,
      reducer: {
        success: (store, action) => {
          store.logFile = _.get(action,'data');
        }
      }
    },
    queryLog: {
      async: true,
      reducer: {
        success: (store, action) => {
          let logContent = _.get(action, 'data').success;
          if (_.isEmpty(logContent)) {
            logContent = [''];
          }
          store.logContent = logContent;
        }
      }
    },
  }
};
