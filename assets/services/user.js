"use strict";

let Ajax = require("../actions/utils/ajax");
let user = {};
let _ = require("lodash");
let URL = require("url");

function getUser() {
  return new Promise((resolve, reject) => {
    Ajax.request("GET", "/api/user", {}, {}, (error, data) => {
      user = _.cloneDeep(data.data);
      resolve(data.data);
    })
  });
}

function getUserSync() {
  return user;
}


function setUserInfo(info) {
  user = _.assign({},user,info);
}

module.exports = {
  getUser,
  getUserSync,
  setUserInfo
};
