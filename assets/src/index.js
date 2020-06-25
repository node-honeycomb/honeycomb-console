import dva from 'dva';
import createLoading from 'dva-loading';
import { createBrowserHistory } from 'history';

import router from './router';
import loginRouter from './login-router';
import globalModel from './model/global';
import userModel from './model/user';

import './index.less';

const { isLogin } = window.CONFIG;

const app = dva({
  history: createBrowserHistory(),
});

app.use(createLoading());

[globalModel, userModel].forEach((key) => app.model(key));

app.router(isLogin ? loginRouter : router);

app.start('#main');
