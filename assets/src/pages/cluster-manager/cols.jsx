import React from 'react';

const cols = () => [
  {
    title: '集群名称',
    dataIndex: 'name',
  },
  {
    title: '集群code',
    dataIndex: 'code'
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
    dataIndex: 'ipList'
  },
  {
    title: '操作',
    render() {
      return (
        <div>
          <a>编辑</a> | <a>删除</a>
        </div>
      );
    }
  }
];

export default cols;
