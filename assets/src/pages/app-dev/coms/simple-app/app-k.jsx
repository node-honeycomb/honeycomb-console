import React from 'react';
import {connect} from 'dva';
import {Tooltip} from 'antd';
import PropTypes from 'prop-types';
import {RiseOutlined, FallOutlined, AlignLeftOutlined} from '@ant-design/icons';

const getTitle = (title) => {
  return (
    <span>
      {title} 详情
    </span>
  );
};

// 渲染应用使用情况走势
const AppK = (props) => {
  const {k, currentClusterCode, appName} = props;

  switch (k) {
    case 0:
      return null;
    case 1:
      return (
        <span>
          <Tooltip title={getTitle('呈上升趋势', appName, currentClusterCode)}>
            <RiseOutlined />
          </Tooltip>
        </span>
      );
    case 2:
      return (
        <span>
          <Tooltip title={getTitle('呈下降趋势', appName, currentClusterCode)}>
            <FallOutlined />
          </Tooltip>
        </span>
      );
    case 3:
      return (
        <span>
          <Tooltip title={getTitle('波动', appName, currentClusterCode)}>
            <AlignLeftOutlined rotate={-90} />
          </Tooltip>
        </span>
      );
  }
};

AppK.propTypes = {
  k: PropTypes.number,
  appName: PropTypes.string,
  currentClusterCode: PropTypes.string
};

const mapState2Props = (state) => {
  return {
    currentClusterCode: state.global.currentClusterCode,
  };
};

export default connect(mapState2Props)(AppK);
