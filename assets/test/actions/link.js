'use strict';

let normalize = require('normalizr').normalize;
let arrayOf = require('normalizr').arrayOf;
let Schema = require('normalizr').Schema;

// 支持export一个大对象

// initStore
// actions
// externalReducers

let initStore = {
  fetching: false,
  result: [],
  meta: {}
};

let actions = {
  sort: {
    reducer: function (store, action) {
      store.result.sort((a, b) => (a > b));
    }
  },
  getList: {
    async: true,
    reducer: function (store, action) {
      store.fetching = false;
      let actionData = action.data;
      let meta = new Schema('meta', {idAttribute: 'id'});
      let map = normalize(actionData, arrayOf(meta));

      store.result = map.result;
      Object.assign(store.meta, map.entities.meta);

      return store;
    }
  }
};

let externalReducers = {
};

module.exports = {
  store: initStore,
  actions,
  externalReducers
};

