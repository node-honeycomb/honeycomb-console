import React from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import {Menu, Dropdown, Tooltip} from 'antd';
import {
  UserOutlined, CopyOutlined, PauseCircleOutlined,
  LogoutOutlined, InfoCircleOutlined, SettingOutlined,
  BookOutlined
} from '@ant-design/icons';

import WhiteSpace from '@coms/white-space';

import clusterTip from '../cluster-tip';

import './index.less';

const userName = _.get(window, 'CONFIG.user.name');
const {docUrl} = window.CONFIG;
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
  const {currentCluster} = props;

  return (
    <div className="hc-header">
      <div className="left">
        <span
          onClick={props.onToggleCluster}
          className="menu-item show-cluster-sider"
        >
          <CopyOutlined />集群列表{clusterTip(currentCluster)}
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
          <Tooltip title="帮助手册">
            <a
              href={docUrl}
              target="_blank"
              rel="noreferrer"
              className="black-text"
            >
              <BookOutlined />
            </a>
          </Tooltip>
        </span>
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
  onToggleCluster: PropTypes.func,
  currentCluster: PropTypes.object
};

export default Header;

