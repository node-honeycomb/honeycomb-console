'use strict';

let _ = require('lodash');
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
          let _data = _.get(action, 'data');
          _.forEach(_data, (items, ip) => {
            _.map(items, (item, index) => {
              _.map(item, (value, key) => {
                let obj = [];
                if (_.isArray(value)) {
                  value = value.join(';');
                }
                value.split(';').map((v) => {
                  obj.push({
                    x: v.split(',')[0],
                    y: v.split(',')[1]
                  });
                });
                _.set(_data, [ip, index, key], obj);
              });
            });
          });
          store.meta = _data;
          let appList = _.keys(_.find(_.values(store.meta), (o) => {
            return !_.isEmpty(o);
          }));
          store.appList = _.filter(appList, (item) => {
            return item.indexOf('SYSTEM') < 0;
          });
        }
      }
    },
  }
};
