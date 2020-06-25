import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

import './index.less';

const CommonTitle = (props) => {
  return <h3 className="common-title">{_.get(props, 'children')}</h3>;
};

CommonTitle.propTypes = {
  children: PropTypes.string,
};

export default CommonTitle;
