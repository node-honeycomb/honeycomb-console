import React, {useState, useCallback} from 'react';
import {Form, Input, Button, message} from 'antd';
import {UserOutlined, LockOutlined} from '@ant-design/icons';

import PAGES from '@lib/pages';
import {userApi} from '@api/index';
import notification from '@coms/notification';

import './index.less';

const {userCount, prefix} = window.CONFIG;

// 当系统中一个用户都没有时, 调用初始化模式
const isInit = userCount === 0;
const LOGO_IMG = `${prefix}/assets/static/logo.png`;

const Login = () => {
  const [loading, setLoading] = useState(false);

  const onCreate = useCallback(async (value) => {
    if (!value) {
      return;
    }

    const {username, password} = value;

    setLoading(true);

    try {
      await userApi.login({username, password});

      message.success('登录成功！');
      setTimeout(() => {
        window.location.href = PAGES.APP_DEV;
      }, 1000);
    } catch (e) {
      notification.error({
        message: '登录失败',
        description: e.message
      });
    }

    setLoading(false);
  }, []);

  const onInit = useCallback(async (value) => {
    if (!value) {
      return;
    }

    const {username, password} = value;

    setLoading(true);

    try {
      await userApi.initUser({username, password});

      message.success('初始化用户成功！正在跳转登录页面');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (e) {
      notification.error({
        message: '初始化失败',
        description: e.message
      });
    }

    setLoading(false);
  });


  return (
    <div className="login">
      <div className="login-box">
        <h1 className="login-box-title">
          <span className="login-logo-p">
            <span className="login-box-logo" style={{backgroundImage: `url(${LOGO_IMG})`}}></span>
          </span>
          {
            isInit ? '系统初始化' : '用户登录'
          }
        </h1>
        <Form
          className="login-form"
          initialValues={{remember: true}}
          onFinish={isInit ? onInit : onCreate}
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
            <Input.Password
              prefix={<LockOutlined className="site-form-item-icon" />}
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
              {
                isInit ? '创建用户' : '登录'
              }
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default Login;

