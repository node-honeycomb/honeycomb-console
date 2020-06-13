import React from 'react';
import PropTypes from 'prop-types';
import {Router} from 'dva/router';

import Login from './pages/login';

const router = ({history}) => {
  return (
    <Router history={history}>
      <Login />
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
