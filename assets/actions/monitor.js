"use strict";

let _ = require("lodash");
module.exports = {
  store: {
    meta: [],
    appList: []
  },
  actions: {
    queryAppUsages: {
      async: true,
      reducer: {
        success: (store, action) => {
          store.meta = _.get(action, "data");
          let appList = _.keys(_.find(_.values(store.meta), (o)=>{ return !_.isEmpty(o)}));
          store.appList = _.filter(appList, (item) => {
            return item.indexOf("SYSTEM") < 0
          })
        }
      }
    },
  }
}
