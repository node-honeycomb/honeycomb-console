"use strict";

const routing = require('react-router-redux').routerReducer;
const _ = require("lodash");
const actionGenerator = require('./utils/action_gen');
const moduleList = require("./modules");

let actionMap = {};
let models = {};
moduleList.forEach((actionName) => {
  try {
    actionMap[actionName] = require('./' + actionName);
  }catch(e) {
    console.error("请确认require正确的'" + actionName + "' action文件");
    actionMap[actionName] = {};
  }
  try {
    models[actionName] = require("../models/" + actionName);
  } catch(e) {
    console.error("请确认require正确的'" + actionName + "' model文件");
    models[actionName] = {};
  }
});

let actions = actionGenerator(actionMap, models);

module.exports = actions;
