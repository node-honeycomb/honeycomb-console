import React, {useState, useEffect, useCallback} from 'react';
import {Table, Button} from 'antd';
import {userApi} from '@api';

import notification from '@coms/notification';
import CommonTitle from '@coms/common-title';

import userUpsert from './coms/user-upsert';

import cols from './cols';

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
        description: err.message
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const onAddUser = useCallback(async () => {
    userUpsert();
  });

  useEffect(() => {
    getUser();
  }, []);

  return (
    <div>
      <CommonTitle>用户管理</CommonTitle>
      <Button
        type="primary"
        className="margin-b10"
        onClick={onAddUser}
      >
          + 添加用户
      </Button>
      <Table
        columns={cols()}
        dataSource={users}
        rowKey="id"
        loading={loading}
      />
    </div>
  );
};

export default UserManager;
