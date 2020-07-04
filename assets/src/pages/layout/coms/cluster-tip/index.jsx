import React from 'react';
import {Tooltip} from 'antd';

const clusterTip = (cluster) => {
  if (!cluster) {
    return null;
  }

  const {name, code} = cluster;

  if (!name) {
    return null;
  }

  const content = (
    <span>
      {name}({code})
    </span>
  );

  return (
    <span>
      <Tooltip
        placement="right"
        title={content}
      >
      （{name}）
      </Tooltip>
    </span>
  );
};

export default clusterTip;
