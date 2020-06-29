import React, {useState, useEffect, useCallback} from 'react';
import _ from 'lodash';
import {connect} from 'dva';
import notification from '@coms/notification';
import CommonTitle from '@coms/common-title';
import moment from 'moment';
import {userApi} from '@api';
import {Table, Button, Divider, Popconfirm, message} from 'antd';
import {USER_ROLE_TITLE, USER_STATUS_TITLE} from '../../lib/consts';
import userUpsert from './coms/user-upsert';

const userName = _.get(window, 'CONFIG.user.name');

const UserManager = () => {
  const [users, setUser] = useState([]);
  const [loading, setLoading] = useState(false);

  const getUser = useCallback(async () => {
    try {
      setLoading(true);
      const data = await userApi.list();

      setUser(data);
      setLoading(false);
    } catch (err) {
      notification.error({
        message: '请求用户列表失败',
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const onAddUser = useCallback(async () => {
    userUpsert({getUser});
  });

  useEffect(() => {
    getUser();
  }, []);

  const handleEdit = (row) => {
    userUpsert({row, getUser});
  };

  const handleConfirm = async (row) => {
    const rowName = _.get(row, 'name');

    try {
      await userApi.deleteUser({name: rowName});
      getUser();
      message.success('用户删除成功');
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

  return (
    <div>
      <CommonTitle>用户管理</CommonTitle>
      <Button type="primary" className="margin-b10" onClick={onAddUser}>
        + 添加用户
      </Button>
      <Table
        columns={cols()}
        dataSource={users}
        rowKey="gmtCreate"
        loading={loading}
      />
    </div>
  );
};

const mapStateProps = (state) => {
  const user = state.user;
  // const loading = state.loading;
  // const userLoading = _.get(loading.effects, 'user/getUsers');

  return {
    user,
    // loading: userLoading,
  };
};

export default connect(mapStateProps)(UserManager);
