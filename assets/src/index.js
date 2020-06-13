import dva from 'dva';
import createLoading from 'dva-loading';
import {createBrowserHistory} from 'history';

import router from './router';
import loginRouter from './login-router';

import './index.less';

const {isLogin} = window.CONFIG;

const app = dva({
  history: createBrowserHistory(),
});

app.use(createLoading());

app.router(isLogin ? loginRouter : router);

app.start('#main');
