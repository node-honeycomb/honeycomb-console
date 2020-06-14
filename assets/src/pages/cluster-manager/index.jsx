import React from 'react';
import {Table, Button} from 'antd';

import CommonTitle from '@coms/common-title';

import cols from './cols';

const UserManager = () => {
  return (
    <div>
      <CommonTitle>集群管理</CommonTitle>
      <Button
        type="primary"
        className="margin-b10"
      >
          + 添加集群
      </Button>
      <Table
        columns={cols()}
        dataSource={[]}
        rowKey="id"
      />
    </div>
  );
};

export default UserManager;
