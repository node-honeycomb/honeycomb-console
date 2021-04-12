import React from 'react';
import _ from 'lodash';
import {Input} from 'antd';
import PropTypes from 'prop-types';

import './index.less';

const CommonTitle = (props) => {
  const {onSearch, searchVisible} = props;

  return (
    <div className="common-title-box">
      <h3 className="common-title">
        {_.get(props, 'children')}
      </h3>
      {
        searchVisible && (
          <Input.Search
            style={{maxWidth: 250}}
            onSearch={onSearch}
            placeholder="键入以搜索"
          />
        )
      }
    </div>
  );
};

CommonTitle.defaultProps = {
  searchVisible: false,
  onSearch: () => null
};

CommonTitle.propTypes = {
  children: PropTypes.string,
  onSearch: PropTypes.func,
  searchVisible: PropTypes.bool
};

export default CommonTitle;
