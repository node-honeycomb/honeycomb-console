import React from 'react';
import PropTypes from 'prop-types';

import './index.less';

const Card = (props) => {
  return (
    <div className="hc-card" {...props}>
      {props.children}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.element
};

export default Card;

