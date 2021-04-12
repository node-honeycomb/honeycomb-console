import React from 'react';
import _ from 'lodash';
import moment from 'moment';
import {userApi} from '@api';
import {Button, Divider, Popconfirm} from 'antd';
import notification from '@coms/notification';
import {USER_ROLE_TITLE, USER_STATUS_TITLE} from '../../lib/consts';
import userUpsert from './coms/user-upsert';

const userName = _.get(window, 'CONFIG.user.name');

const handleEdit = () => {
  userUpsert();
};

const handleConfirm = async (row) => {
  const rowName = _.get(row, 'name');

  try {
    await userApi.deleteUser({username: rowName});
  } catch (error) {
    notification.error({
      message: '用户删除失败',
      description: error.message,
    });
  }
};

const cols = () => [
  {
    title: '用户名',
    dataIndex: 'name',
  },
  {
    title: '用户角色',
    dataIndex: 'role',
    render(text) {
      return USER_ROLE_TITLE[text] || text;
    },
  },
  {
    title: '用户状态',
    dataIndex: 'status',
    render(text) {
      return USER_STATUS_TITLE[text] || text;
    },
  },
  {
    title: '创建时间',
    dataIndex: 'gmtCreate',
    render(text) {
      return moment(text).format('YYYY-MM-DD HH:mm:ss');
    },
  },
  {
    title: '操作',
    render(row) {
      const style = {padding: '0px'};
      // TODO: 用户不可删除自己, 需要做 tooltip 提示
      const rowName = _.get(row, 'name');
      const isUserSelf = rowName === userName;

      return (
        <div>
          <Button style={style} type="link" onClick={() => handleEdit(row)}>
            编辑
          </Button>
          <Divider type="vertical" />
          <Popconfirm
            title="确定要删除该用户?"
            onConfirm={() => handleConfirm(row)}
            okText="确定"
            cancelText="取消"
            disabled={isUserSelf}
          >
            <Button style={style} type="link" disabled={isUserSelf}>
              删除
            </Button>
          </Popconfirm>
        </div>
      );
    },
  },
];

export default cols;
