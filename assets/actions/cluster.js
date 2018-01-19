"use strict";

let _ = require("lodash");

module.exports = {
  store: {
    meta: {

    },
    result: []
  },
  actions: {
    getCluster: {
      async: true,
      reducer: {
        success: (store, action) => {
          store.meta = {};
          store.result = [];
          store.meta = _.get(action, "data");
          _.forEach(_.get(action, "data"), (value, key) => {
            store.result.push(key);
          });
        }
      }
    },
    addCluster: {
      async: true,
      reducer: {
        success: (store, action) => {
          let param = action.param;
          let newCluster={}
          newCluster[param.code]={
            name:param.name,
            ips:param.ips,
            token:param.token,
            endpoint:param.endpoint
          }
          store.meta = _.assign({},_.get(action,"data"),newCluster);
          _.forEach(store.meta,(value,key)=>{
            store.result.push(key);
          })
        }
      }
    },
    deleteCluster: {
      async: true,
    }
  },
}