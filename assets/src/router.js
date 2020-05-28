import React from 'react';
import PropTypes from 'prop-types';
import {Router, Route, Switch} from 'dva/router';
import dynamic from 'dva/dynamic';

const load = (component) => {
  return dynamic({component});
};

const prefix = window.CONFIG.prefix;

// eslint-disable-next-line
const Layout = load(() => import('./pages/layout'));
const AppList = load(() => import('./pages/app-list'));

const router = ({history}) => {
  return (
    <Router history={history}>
      <Switch>
        <Layout>
          <Switch>
            <Route path={`${prefix}/app-list`} component={AppList} />
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
