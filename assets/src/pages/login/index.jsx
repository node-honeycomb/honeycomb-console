import React, {useState, useCallback} from 'react';
import {Form, Input, Button, message} from 'antd';
import {UserOutlined, LockOutlined} from '@ant-design/icons';

import {userApi} from '@api/index';
import notification from '@coms/notification';

import './index.less';

const {userCount} = window.CONFIG;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const onSubmit = useCallback(async (value) => {
    if (!value) {
      return;
    }

    const {username, password} = value;

    setLoading(true);

    try {
      const result = await userApi.login({username, password});

      message.success('登录成功！');
      console.log(result);
    } catch (e) {
      notification.error({
        message: '登录失败',
        description: e.message
      });
    }

    setLoading(false);
  }, []);


  return (
    <div className="login">
      <div className="login-box">
        <h1 className="login-box-title">用户登录</h1>
        <Form
          className="login-form"
          initialValues={{remember: true}}
          onFinish={onSubmit}
        >
          <Form.Item
            name="username"
            rules={[
              {
                required: true, message: '用户名不能为空'
              }
            ]
            }
          >
            <Input
              prefix={<UserOutlined className="site-form-item-icon" />}
              placeholder="用户名"
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[
              {
                required: true, message: '密码不能为空'
              }
            ]
            }
          >
            <Input
              prefix={<LockOutlined className="site-form-item-icon" />}
              type="password"
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="login-form-button"
              loading={loading}
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default Login;

