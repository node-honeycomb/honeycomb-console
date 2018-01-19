"use strict";

let _ = require("lodash");

module.exports = {
  store: {
    meta: {

    }
  },
  actions: {
    addAcl: {
      async: true,
      reducer: {
        success: (store, action) => {
        }
      }
    },
    createAcl: {
      async: true,
      reducer: {
        start: (store, action) => {
          store.meta.forEach(function (cluster) {
            if (cluster.cluster_code === action.data.cluster_code) {
              cluster.acls.push(_.merge({}, action.data, {_creating: action.data.cluster_code + action.data.nickname}));
              return;
            }
          });
        },
        success: (store, action) => {
          store.meta.forEach(function (cluster) {
            if (cluster.cluster_code === action.param.cluster_code) {
              cluster.acls.forEach(function (acl) {
                if (acl._creating && acl._creating === action.param.cluster_code + action.param.nickname) {
                  delete acl._creating;
                  acl.id = cluster.acls.length;
                  return;
                }
              });
            }
          });
        },
        fail: (store, action) => {
          store.meta.forEach(function (cluster) {
            cluster.acls.forEach(function (acl) {
              if (acl._creating) {
                cluster.acls.pop();
                return;
              }
            });
          });
        }
      }
    },
    deleteAcl: {
      async: true,
      reducer: {
        start: (store, action) => {

        },
        success: (store, action) => {
          store.meta.forEach(function (cluster) {
            if (cluster.cluster_code === action.param.acl.cluster_code) {
              var indexToDelete = -1;
              cluster.acls.forEach(function (acl, index) {
                if (acl.cluster_code === action.param.acl.cluster_code && acl.nickname === action.param.acl.nickname) {
                  indexToDelete = index;
                  return;
                }
              });
              if (indexToDelete > -1) {
                cluster.acls.splice(indexToDelete, 1);
              }
            }
          });
        },
        fail: (store, action) => {

        }
      }
    },
    updateAcl: {
      async: true,
      reducer: {
        start: (store, action) => {
          var acl = action.data.acl;
          store.meta.forEach((cluster) => {
            if (cluster.cluster_code === acl.cluster_code) {
              cluster.acls.forEach((userAcl, index) => {
                if (userAcl.id === acl.id) {
                  cluster.acls[index] = acl;
                }
              });
            }
          });
        },
        success: () => {
        },
        fail: () => {}
      }
    },
    getAcl: {
      async: true,
      reducer: {
        success: (store, action) => {
          var clusterAcl = _.get(action, 'data');
          
            var clusters = {};

            Object.keys(window.user.clusterAcl).forEach(function(clusterCode){
              var ownCluster = window.user.clusterAcl[clusterCode];

              if (ownCluster.isAdmin) {
                clusters[clusterCode] = {
                  cluster_code: clusterCode,
                  cluster_name: ownCluster.name,
                  cluster_id: ownCluster.id,
                  key: clusterCode,
                  acls: []
                };
              }
            });
            clusterAcl.forEach(function(item, index){
              // if (!clusters[item.cluster_code]) {
              //   clusters[item.cluster_code] = {
              //     cluster_code: item.cluster_code,
              //     cluster_name: item.cluster_name,
              //     key: item.cluster_code,
              //     acls: []
              //   };
              // }
              item.key = item.cluster_code + item.name;
              clusters[item.cluster_code].acls.push(item);
              clusters[item.cluster_code].cluster_id = item.cluster_id;
            });

            var clusterAclList = [];
            Object.keys(clusters).map(function (clusterCode) {
              clusterAclList.push(clusters[clusterCode]);
              return 1;
            });
            console.log(clusters)
            store.meta = clusterAclList;
        }
      }
    },
    getAppList: {
      async: true,
      reducer: {
        success: (store, action) => {
          
        }
      }
    }
  }
};

