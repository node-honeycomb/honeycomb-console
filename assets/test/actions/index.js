'use strict';

const actionGenerator = require('../../actions/utils/action_gen');
const reducerGenerator = require('../../store/reducer_gen');
const models = require('../models');

const actionMap = {
  models: require('./models'),
  object: require('./object'),
  link: require('./link'),
  tag: require('./tag')
};

module.exports = actionGenerator(actionMap, models);
module.exports._rootReducer = reducerGenerator(actionMap);

