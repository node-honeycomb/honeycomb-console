import React from 'react';
import {Table, Button} from 'antd';

import CommonTitle from '@coms/common-title';

// import cols from './cols';

const UserManager = () => {
  const cols = () => [
    {
      title: '集群名称',
      dataIndex: 'name',
    },
    {
      title: '集群code',
      dataIndex: 'code',
    },
    {
      title: 'endpoint',
      dataIndex: 'endpoint',
    },
    {
      title: '秘钥',
      dataIndex: 'token',
    },
    {
      title: 'ip列表',
      dataIndex: 'ipList',
    },
    {
      title: '操作',
      render() {
        return (
          <div>
            <a>编辑</a> | <a>删除</a>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <CommonTitle>集群管理</CommonTitle>
      <Button type="primary" className="margin-b10">
        + 添加集群
      </Button>
      <Table columns={cols()} dataSource={[]} rowKey="id" />
    </div>
  );
};

export default UserManager;
