"use strict";

let _ = require("lodash");

module.exports = {
  store: {
    users: []
  },
  actions: {
    listUser: {
      async: true,
      reducer: {
        success: (store, action) => {
          store.users = action.data;
        }
      }
    },
    createUser: {
      async: true,
      reducer: {
        success: (store) => {
          store.reload = true;
        }
      }
    },
    deleteUser: {
      async: true,
      reducer: {
        success: (store) => {
          store.reload = true;
        }
      }
    }
  }
};

