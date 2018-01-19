'use strict';

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
  sortTag: {
    reducer: function (store, action) {
      store.tag.result.sort((a, b) => (a > b));
    }
  },
  getList: {
    async: true,
    reducer: {
      start: function (store, action) {
      },
      success: function (store, action) {
      }
    }
  }
};

let externalReducers = {
  'models.getObjectList.start': function (store, action) {
    store.objectFetched = true;
  },
  'link.sort': function (store, action) {
    store.linkSorted = true;
  }
};

module.exports = {
  store: initStore,
  actions,
  externalReducers
};

