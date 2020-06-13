import React from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import {Menu, Dropdown} from 'antd';
import {
  UserOutlined, CopyOutlined, PauseCircleOutlined,
  LogoutOutlined, InfoCircleOutlined, SettingOutlined
} from '@ant-design/icons';

import WhiteSpace from '@coms/white-space';

import './index.less';

const userName = _.get(window, 'CONFIG.user.name');
const prefix = window.CONFIG.prefix;

const menu = (
  <Menu>
    <Menu.Item>
      <div className="user-dp-menu-item">
        <a href={`${prefix}/logout`}>
          <LogoutOutlined /><WhiteSpace />登出
        </a>
      </div>
    </Menu.Item>
    <Menu.Item>
      <div className="user-dp-menu-item">
        <SettingOutlined /> <WhiteSpace />个人信息
      </div>
    </Menu.Item>
    <Menu.Item>
      <div className="user-dp-menu-item">
        <InfoCircleOutlined /> <WhiteSpace />关于
      </div>
    </Menu.Item>
  </Menu>
);

const Header = (props) => {
  return (
    <div className="hc-header">
      <div className="left">
        <span onClick={props.onToggleCluster} className="menu-item">
          <CopyOutlined />集群列表
        </span>
        <span className="menu-item">
          <PauseCircleOutlined /> 集群信息
        </span>
      </div>
      <div className="center">
        <div className="menu-title">
          HC-Console
        </div>
      </div>
      <div className="right">
        <span className="menu-item">
          <Dropdown
            overlay={menu}
            placement="bottomRight"
            overlayStyle={{paddingTop: 10}}
          >
            <span>
              <UserOutlined />{userName}
            </span>
          </Dropdown>
        </span>
      </div>
    </div>
  );
};

Header.propTypes = {
  onToggleCluster: PropTypes.func
};

export default Header;

