"use strict";

const Immutable = require('seamless-immutable');
const actionNameGen = require("../actions/utils/action_name_gen");

function noop(){}
module.exports = (moduleList) => {
  let rootReducer = {};
  let moduleKeys = Object.keys(moduleList);
  moduleKeys.forEach((moduleKey) => {
    
    let processorMap = {};

    let module = moduleList[moduleKey];
    if(module.default) module = module.default; 

    let initStore = module.store;
    let actions = module.actions;
    let externalReducers = module.externalReducers;
    let actionKeys = Object.keys(actions);
    actionKeys.map((actionKey) => {
      let actionCfg = actions[actionKey];
      if (!actionCfg.async) {
        let type = actionNameGen(moduleKey, actionKey);
        processorMap[type] = actionCfg.reducer;
      } else {
        let reducer = actionCfg.reducer;
        if (!reducer) {
          // throw '未配置reducers actionKey: ' + ak;
          reducer = noop;
        }
        if (typeof reducer === 'function') {
          reducer = {
            success: reducer
          };
        }

        for(let reducerKey in reducer) {
          if(!typeof reducer[reducerKey] === 'function') return;
          let type = actionNameGen(moduleKey, actionKey, reducerKey);
          processorMap[type] = reducer[reducerKey];
        }

      }
    });

    let externalReducerKeys = Object.keys(externalReducers || {});
    externalReducerKeys.forEach(rk => {
      
      let names = rk.split(".");
      let moduleName = names[0];
      let actionName = names[1];
      let statusName;
      let isAsyncAction = (names.length === 3);
      if(isAsyncAction) {
        statusName = names[2];
      }
      let type = '';
      if(!isAsyncAction) {
        type = actionNameGen(moduleName, actionName);
        processorMap[type] = externalReducers[rk];
      } else {
        if (typeof externalReducers[rk] === 'function') {
          type = actionNameGen(moduleName, actionName, statusName);
          processorMap[type] = externalReducers[rk];
        } else if(typeof externalReducers[rk] === 'object') {
          let reducer = externalReducers[rk];
          for(let reducerKey in reducer) {
            if(!typeof reducer[reducerKey] === 'function') return;
            type = actionNameGen(moduleKey, actionKey, reducerKey);
            processorMap[type] = reducer[reducerKey];
          }
        }
      }
    });

    let reducer = function (store = Immutable(initStore), action) {
      let type = action.type;
      let processor = processorMap[type] || noop;
      let newStore = Immutable.asMutable(store, {deep: true});
      let returnStore = processor(newStore, action, action.data, action.param, action.urlParam, action.options);
      returnStore = returnStore || newStore;
      return Immutable(returnStore);
    };

    rootReducer[moduleKey] = reducer;
  });

  const routing = require('react-router-redux').routerReducer;
  const combineReducers = require('redux').combineReducers;
  rootReducer.routing = routing;
  return combineReducers(rootReducer);
}

