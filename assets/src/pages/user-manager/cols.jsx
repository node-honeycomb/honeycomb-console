import React from 'react';
import moment from 'moment';
import {USER_ROLE_TITLE, USER_STATUS_TITLE} from '../../lib/consts';

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
    }
  },
  {
    title: '用户状态',
    dataIndex: 'status',
    render(text) {
      return USER_STATUS_TITLE[text] || text;
    }
  },
  {
    title: '创建时间',
    dataIndex: 'gmtCreate',
    render(text) {
      return moment(text).format('YYYY-MM-DD HH:mm:ss');
    }
  },
  {
    title: '操作',
    render() {
      // TODO: 用户不可删除自己, 需要做 tooltip 提示
      return (
        <div>
          <a>编辑</a> | <a>删除</a>
        </div>
      );
    }
  }
];

export default cols;
