'use strict';

let normalize = require('normalizr').normalize;
let arrayOf = require('normalizr').arrayOf;
let Schema = require('normalizr').Schema;

// 支持export一个大对象

// initStore
// actions
// externalReducers

let initStore = {
  object: {
    fetching: false,
    result: [],
    meta: {}
  },
  link: {
    fetching: false,
    result: [],
    meta: {}
  },
  tag: {
    fetching: false,
    result: [],
    meta: {}
  }
};

let actions = {
  sortObject: {
    reducer: function (store, action) {
      store.object.result.sort((a, b) => (a > b));
    }
  },
  getObjectList: {
    async: true,
    reducer: {
      start: function (store, action) {
        store.object.fetching = true;
      },
      success: function (store, action) {
        store.object.fetching = false;
        let actionData = action.data;
        let meta = new Schema('meta', {idAttribute: 'id'});
        let map = normalize(actionData, arrayOf(meta));
   
        store.object.result = map.result;
        Object.assign(store.object.meta, map.entities.meta);

        return store;
      },
      fail: function (store, action) {
        store.object.fetching = false;
      }
    }
  },
  getOneObject: {
    async: {
      url: '/api/v2/objects/:objectId',
      method: 'GET'
    },
    reducer: function (store, action) {
    }
  }
};

let externalReducers = {
  'object.getList.start': function (store, action) {
  },
  'link.sort': function (store, action) {
  }
};

module.exports = {
  store: initStore,
  actions,
  externalReducers
};

