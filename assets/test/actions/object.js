'use strict';


// 支持class的写法

// initStore:       this.properties
// externalReducers this.getExternalReducers
// actions:         所有其它方法,支持多种写法

class Obj {
  constructor() {
    // super();
  }

}

Obj.store = {
  list: [],
  linkSorted: false
};

Obj.actions = {
  sortUser: {
    reducer: function (store, action) {
    }
  },
  getList: {
    async: true,
    reducer: function (store, action) {
      store.list = action.data;
    }
  },
  updateOne: {
    async: true,
    render: {
      success: function (store, action) {
      }
    }
  }
};

Obj.externalReducers = {
  'link.sort': function (store, action) {
    store.linkSorted = true;
  }
};

exports.default = Obj;
