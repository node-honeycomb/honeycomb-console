'use strict';
const actionNameGen = require('./action_name_gen');
const httpActionGen = require('./http_action_gen');
const _ = require('lodash');

function noop() {}
module.exports = (moduleList, models) => {

  let rootActions = {};

  let moduleKeys = Object.keys(moduleList);
  moduleKeys.forEach((moduleKey) => {

    rootActions[moduleKey] = {};

    let module = moduleList[moduleKey];

    // 兼容ES6的写法
    if(module.default) module = module.default;

    let actions = module.actions;

    let actionKeys = Object.keys(actions);
    actionKeys.map((actionKey) => {
      let actionCfg = actions[actionKey];
      if(!actionCfg.async) {
        return rootActions[moduleKey][actionKey] = (data) => {
          return {
            type: actionNameGen(moduleKey, actionKey),
            data: data
          };
        };
      } else {
        let model = models[moduleKey];
        if (!model) {
          throw '未找到model: ' + moduleKey + ' 请确定这个model是否配置正确或是否引用正常。 ';
        }
        let httpCfg = _.extend({},model[actionKey],{
          _moduleKey: moduleKey,
          _actionKey: actionKey
        });
        return rootActions[moduleKey][actionKey] = httpActionGen(httpCfg);
      }
    });
  });

  return rootActions;
}
