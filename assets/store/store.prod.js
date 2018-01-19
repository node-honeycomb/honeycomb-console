'use strict';

let redux = require('redux');
let createStore = redux.createStore;
let applyMiddleware = redux.applyMiddleware;
let thunk = require('redux-thunk').default;
const actionArray = require("../actions/modules");
let moduleList = {};
actionArray.forEach((actionName) => {
  moduleList[actionName] = require('../actions/' + actionName);
});
let rootReducer = require('./reducer_gen')(moduleList);

module.exports = function configureStore(initialState) {
  return createStore(
    rootReducer,
    initialState,
    applyMiddleware(thunk)
  )
}
