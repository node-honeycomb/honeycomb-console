'use strict';

let _ = require('lodash');

module.exports = {
  store: {
    meta: {

    },
    appList: [],
    status: [],
    filterList: {}
  },
  actions: {
    getAppList: {
      async: true,
      reducer: {
        success: (store, action) => {
          store.appList = _.sortBy(_.get(action, 'data.success'), ['name']);
          let newData = [];
          let keyNum = -1;
          let rowSpan = {};
          let filterList = {};
          store.appList.map((value, key) => {
            rowSpan[value.name] = {};
            filterList[value.name] = {
              hide: [],
              show: [],
              lastThree: [],
              status: 'hide',
            };
            let sliceNum = value.versions.length - 3 > -1 ? value.versions.length - 3 : 0;//截取最后3个，只显示最新的三个版本
            value.versions.slice(sliceNum).map((v, k) => {
              filterList[value.name].lastThree.push({//根据versions的字段，拼接成适合table使用的数据格式，sortList代表隐藏时只显示的最新三条信息
                name: value.name,
                index: key + 1,
                version: v.version,
                buildNum: v.buildNum,
                publishAt: v.publishAt,
                appId: v.appId,
                isCurrWorking: v.isCurrWorking,
                cluster: v.cluster
              });
            });
            value.versions.map((item, index) => {
              let data = {
                name: value.name,
                index: key + 1,
                version: item.version,
                buildNum: item.buildNum,
                publishAt: item.publishAt,
                appId: item.appId,
                isCurrWorking: item.isCurrWorking,
                cluster: item.cluster
              };
              //show字段储存所有版本数据
              filterList[value.name].show.push(data);
              //hide字段储存所有online版本和retry版本
              if (item.cluster[0].status !== 'offline') {
                filterList[value.name].hide.push(data);
              }
            });
          });
          //如果没有online版本，根据offline字段数量保留最新三个收缩
          _.forEach(filterList, (value, key) => {
            if (_.isEmpty(value.hide)) {
              if (value.show.length > 3) {
                value.hide = value.show.slice(3);
              } else {
                value.hide = value.show;
              }
            }
          });
          store.filterList = filterList;
        },
        fail: (store, action) => {
          store.appList = [];
          store.meta = {};
          store.filterList = {};
        }
      }
    },
    getStatus: {
      async: true,
      reducer: {
        success: (store, action) => {
          store.status = _.get(action, 'data.success');
        }
      }
    },
    getCoredump: {
      async: true
    },
    getUnknowProcess: {
      async: true
    },
    deleteCoredump: {
      async: true
    },
    deleteClusterSnapshot: {
      async: true
    },
    deleteUnknowProcess: {
      async: true
    }
  }
};
