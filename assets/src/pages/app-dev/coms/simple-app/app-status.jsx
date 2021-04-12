import React from 'react';
import {Tag} from 'antd';
import PropTypes from 'prop-types';
import {LoadingOutlined} from '@ant-design/icons';

const isOneStatus = (cluster) => {
  const statusmap = {};

  // eslint-disable-next-line no-unused-vars
  for (const machine of cluster) {
    const {ip, status} = machine;

    statusmap[status] = ip;
  }


  return Object.keys(statusmap).length === 1;
};

const colormap = {
  online: 'green',
  offline: 'default',
  init: 'lime',
  exception: '#f50',
  retry: 'orange',
  starting: 'lime',
  stoping: 'default',
  reload: 'line'
};

const stylemap = {
  offline: {
    color: '#a5a2a2'
  }
};

const iconmap = {
  starting: <LoadingOutlined />,
  stoping: <LoadingOutlined />
};

// 渲染应用状态
const AppStatus = (props) => {
  const {cluster} = props;

  const isOne = isOneStatus(cluster);

  if (isOne) {
    const status = cluster[0].status;

    return (
      <Tag
        color={colormap[status]}
        style={stylemap[status]}
      >
        {iconmap[status]} {status}
      </Tag>
    );
  }

  return cluster.map(machine => {
    return (
      <div key={machine.ip}>
        <span>{machine.ip}</span>
        &nbsp;
        <Tag
          color={colormap[machine.status]}
          style={stylemap[status]}
        >
          {iconmap[status]}
          {machine.status}
        </Tag>
      </div>
    );
  });
};

AppStatus.propTypes = {
  cluster: PropTypes.array,      // 不同机器上存储的信息
  isCurrWorking: PropTypes.bool, // 是否正在运行
};

export default AppStatus;
