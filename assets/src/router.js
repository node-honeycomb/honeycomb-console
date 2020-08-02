import React from 'react';
import PropTypes from 'prop-types';
import {Router, Route, Switch} from 'dva/router';
import dynamic from 'dva/dynamic';

import PAGES from './lib/pages';

const load = (component) => {
  return dynamic({component});
};

const Log = load(() => import('./pages/log'));
const Layout = load(() => import('./pages/layout'));
const AppDev = load(() => import('./pages/app-dev'));
const AppConfig = load(() => import('./pages/app-config'));
const UserManager = load(() => import('./pages/user-manager'));
const ClusterManager = load(() => import('./pages/cluster-manager'));
const ClusterAuth = load(() => import('./pages/cluster-auth'));
const SysMonitor = load(() => import('./pages/sys-monitor'));

const router = ({history}) => {
  return (
    <Router history={history}>
      <Switch>
        <Layout>
          <Switch>
            <Route path={PAGES.APP_DEV} component={AppDev} />
            <Route path={PAGES.APP_CONFIG} component={AppConfig} />
            <Route path={PAGES.SYS_MONITOR} component={SysMonitor} />
            <Route path={PAGES.USER_MANAGER} component={UserManager} />
            <Route path={PAGES.CLUSTER_MANAGER} component={ClusterManager} />
            <Route path={PAGES.CLUSTER_AUTH} component={ClusterAuth} />
            <Route path={PAGES.LOG} component={Log} />
          </Switch>
        </Layout>
      </Switch>
    </Router>
  );
};

router.propTypes = {
  history: PropTypes.shape({
    location: PropTypes.shape({
      search: PropTypes.string
    })
  })
};

export default router;
