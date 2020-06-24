import React from 'react';
import {Tooltip} from 'antd';

const clusterTip = (cluster) => {
  if (!cluster) {
    return null;
  }

  const {name, code, ips} = cluster;

  if (!name) {
    return null;
  }

  const content = (
    <span>
      <b>当前集群</b>
      <br />
      集群名称：{name}
      <br />
      集群code：{code}
      <br />
      集群ip：{ips.join('，')}
    </span>
  );

  return (
    <span>
      <Tooltip title={content}>
      （{name}）
      </Tooltip>
    </span>
  );
};

export default clusterTip;
