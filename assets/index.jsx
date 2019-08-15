'use strict';

require('antd/dist/antd.css');
require('./index.less');
const React = require('react');
const ReactDOM = require('react-dom');
const redux = require('redux');
const ReactRedux = require('react-redux');
const Provider = ReactRedux.Provider;
const ReactRouter = require('react-router');
const Router = ReactRouter.Router;

let store = require('./store');
const syncHistoryWithStore = require('react-router-redux').syncHistoryWithStore;
const browserHistory = ReactRouter.browserHistory;
const history = syncHistoryWithStore(browserHistory, store);
let routes = require('./routes.jsx');
let User = require('./services/user');
let rootElement = document.getElementById('server-admin');
import 'babel-polyfill';


Promise.all([User.getUser(), User.getClusterList()]).then(() => {
  ReactDOM.render(
    <Provider store={store}>
      <Router history={history} routes={routes(store, store.dispatch)}>
      </Router>
    </Provider>,
    rootElement
  );
});


