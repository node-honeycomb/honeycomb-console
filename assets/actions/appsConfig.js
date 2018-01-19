"use strict";

let _ = require("lodash");

module.exports = {
  store: {
    meta: {

    },
    result: []
  },
  actions: {
    getAppsConfig : {
      async: true,
      reducer: {
        success: (store, action) => {
          store.meta = _.get(action,"data.success[0].data");
        }
      }
    },
    setAppConfig : {
      async: true,
      reducer: {
        success: (store, action) => {
          try{
            store.meta = JSON.parse(_.get(action,'param.appConfig'));
          }catch(err){
            console.log(err);
          }
        }
      }
    }
  }
}