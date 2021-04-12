/* eslint no-console: 0 */
'use strict';
const _ = require('lodash');
const defaultCfg = require('./config_default');

let userCfg = {};

try {
  userCfg = require('./config');
} catch (e) {
  console.log('[WARN]', e.message);
}

const config = _.merge(defaultCfg, userCfg);

// 兼容老应用
module.exports = config;
