import dva from 'dva';
import createLoading from 'dva-loading';
import {createBrowserHistory} from 'history';
import {loader} from '@monaco-editor/react';

import router from './router';
import userModel from './model/user';
import loginRouter from './login-router';
import globalModel from './model/global';

import './index.less';

const {isLogin, prefix} = window.CONFIG;

loader.config({
  paths: {
    vs: `${prefix}/assets/static/vs`
  }
});

// 修改 title
if (window.CONFIG.envName) {
  document.title = `${window.CONFIG.envName}·Honeycomb-Console`;
}

const app = dva({
  history: createBrowserHistory(),
});

app.use(createLoading());

[globalModel, userModel].forEach((key) => app.model(key));

app.router(isLogin ? loginRouter : router);

app.start('#main');
