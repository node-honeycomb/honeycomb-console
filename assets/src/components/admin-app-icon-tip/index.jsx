import React from 'react';
import {Tooltip} from 'antd';
import {InfoCircleOutlined} from '@ant-design/icons';

const AdminAppIconTip = () => {
  const content = (
    <div>
      管控应用是honeycomb-server的内置应用，
      <br />
      主要是帮助用户honeycomb-server完成应用管理、配置管理等工作
      <br />
      管控应用异常honeycomb-server和honeycomb-console都将无法工作
    </div>
  );

  return (
    <Tooltip
      title={content}
      placement="top"
      style={{width: 500}}
    >
      <InfoCircleOutlined />
    </Tooltip>
  );
};

export default AdminAppIconTip;
