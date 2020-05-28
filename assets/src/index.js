import dva from 'dva';
import createLoading from 'dva-loading';
import {createBrowserHistory} from 'history';

// eslint-disable-next-line
import router from './router';

import './index.less';

const app = dva({
  history: createBrowserHistory(),
});

app.use(createLoading());

app.router(router);

app.start('#main');
