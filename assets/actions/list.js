"use strict";

let _ = require("lodash");

module.exports = {
  store: {
    meta: {

    },
    result: [],
  },
  actions: {
    deleteApps: {
      async: true,
      reducer: {
        success: (store, action) => {
        }
      }
    },
    stopApps: {
      async: true,
      reducer: {
        success: (store, action) => {      
        }
      }
    },
    startApps: {
      async: true,
      reducer: {
        success: (store, action) => {
        }
      }
    },
    reloadApps: {
      async: true,
      reducer: {
        success: (store, action) => {
        }
      }
    },
    cleanAppExitRecord: {
      async: true,
      reducer: {
        success: (store, action) => {
        }
      }
    }
  }
}
