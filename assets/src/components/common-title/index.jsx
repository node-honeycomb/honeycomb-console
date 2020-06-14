import React from 'react';
import PropTypes from 'prop-types';

import './index.less';

const CommonTitle = (props) => {
  return <h3 className="common-title">{props.children}</h3>;
};

CommonTitle.propTypes = {
  children: PropTypes.element
};

export default CommonTitle;
