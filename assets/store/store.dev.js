'use strict';

import { createStore, applyMiddleware, compose } from 'redux';
var thunk = require('redux-thunk').default;
var createLogger = require('redux-logger');

const actionArray = require("../actions/modules");
let moduleList = {};
actionArray.forEach((actionName) => {
  moduleList[actionName] = require('../actions/' + actionName);
});
let rootReducer = require('./reducer_gen')(moduleList);



const enhancer = compose(
  // Middleware you want to use in development:
  applyMiddleware(thunk, createLogger())
  // Required! Enable Redux DevTools with the monitors you chose
  // DevTools.instrument()
);

export default function configureStore(initialState) {
  // Note: only Redux >= 3.1.0 supports passing enhancer as third argument.
  // See https://github.com/rackt/redux/releases/tag/v3.1.0
  const store = createStore(rootReducer, initialState, enhancer);

  // Hot reload reducers (requires Webpack or Browserify HMR to be enabled)
  if (module.hot) {
    module.hot.accept('../actions', () => {
      store.replaceReducer(rootReducer); /*.default if you use Babel 6+ */
    });
  }

  return store;
}

