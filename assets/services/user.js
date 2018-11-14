"use strict";

let Ajax = require("../actions/utils/ajax");
let user = {};
let _ = require("lodash");
let URL = require("url");

function getUser() {
  return new Promise((resolve, reject) => {
    Ajax.request('GET', '/api/user', {}, {}, (error, data) => {
      user = _.cloneDeep(data.data);
      resolve(data.data);
    });
  });
}

function getUserSync() {
  return user;
}


function setUserInfo(info) {
  user = _.assign({},user,info);
}


function getClusterList() {
  return new Promise((resolve, reject) => {
    Ajax.request('GET', '/api/cluster/list', {}, {}, (error, data) => {
      window.clusterList = _.cloneDeep(data.data);
      resolve(data.data);
    });
  });
}

module.exports = {
  getUser,
  getUserSync,
  setUserInfo,
  getClusterList
};
