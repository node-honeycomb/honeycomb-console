import React from 'react';
import _ from 'lodash';
import {clusterApi} from '@api';
import PropTypes from 'prop-types';
import {Menu, Dropdown, Tooltip, Tag, message} from 'antd';
import {
  UserOutlined, CopyOutlined, ClusterOutlined,
  LogoutOutlined, InfoCircleOutlined, SettingOutlined,
  BookOutlined, RedoOutlined, WarningOutlined
} from '@ant-design/icons';

import WhiteSpace from '@coms/white-space';
import callClusterStatus from '@coms/cluster-status';

import {callClusterError} from '../clust-error';

import clusterTip from '../cluster-tip';

import './index.less';

const userName = _.get(window, 'CONFIG.user.name');
const {docUrl, prefix, oldConsole, envName} = window.CONFIG;

const menu = (
  <Menu>
    <Menu.Item>
      <div className="user-dp-menu-item">
        <a
          onClick={() => {
            localStorage.clear();
            window.location = `${prefix}/logout`;
          }}
        >
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

const getIsClusterError = (currentCluster, coreDump, unknowPro) => {
  const isToken = currentCluster.token === '***honeycomb-default-token***';

  const isCoreWarn = _.some(coreDump, core => {
    return core.data && (core.data.length > 0);
  });

  const isUnkWarn = _.some(unknowPro, unkn => {
    return unkn.data && (unkn.data.length > 0);
  });


  return isCoreWarn || isUnkWarn || isToken;
};

async function fixCluster(data) {
  const key = (new Date()).toString();
  try {
    message.loading({
      content: '修复中...',
      duration: 1000,
      key: key
    });
    await clusterApi.fixCluster(data.clusterCode);
    message.success({
      content: '修复成功！',
      key
    });
  } catch (e) {
    message.error({
      content: `修复失败：${e.message}`,
      key
    });
  }
};

const versionCompare = (v1, v2) => {
  v1 = v1.replace(/_/g, '.');
  v2 = v2.replace(/_/g, '.');
  const aVer = v1.split('.');
  const bVer = v2.split('.');

  for (let i = 0; i < 3; i++) {
    if (+aVer[i] > +bVer[i]) {
      return 1;
    } else if (+aVer[i] < +bVer[i]) {
      return -1;
    }
  }

  return 0;
};

const checkClusterVersion = (statusObjs) => {
  let serverSecure = false;

  statusObjs.forEach(status => {
    const serverVer = _.get(status, 'serverVersion');

    if (versionCompare(serverVer, window.CONFIG.secureServerVersion) >= 0) {
      serverSecure = true;
    }
  });

  return serverSecure;
};

const Header = (props) => {
  const {
    currentCluster, clusterStatus, coreDumps,
    unknowProcesses, onDeleteUnknowProcess,
  } = props;

  const isClusterError = getIsClusterError(currentCluster, coreDumps, unknowProcesses);
  const serverSecure = checkClusterVersion(clusterStatus);

  return (
    <div className="hc-header">
      <div className="left">
        <div className="menu-title">
          HC-Console
          {
            envName && <Tag style={{marginLeft: 10}} color="blue">{envName}</Tag>
          }
        </div>
        <span
          onClick={props.onToggleCluster}
          className="menu-item show-cluster-sider"
        >
          <CopyOutlined />集群列表{clusterTip(currentCluster)}
        </span>
        <span
          onClick={() => callClusterStatus({
            clusterCode: currentCluster.code
          })}
          className="menu-item show-cluster-sider">
          <span><ClusterOutlined />集群信息</span>          
        </span>
        <span className="menu-item" onClick={() => fixCluster({
            clusterCode: currentCluster.code
          })}>-FIX</span>
        {
          isClusterError && (
            <span
              className="menu-item show-cluster-sider"
              style={{
                color: 'red',
                alignItems: 'center',
                display: 'flex'
              }}
              onClick={() => callClusterError(
                {
                  serverSecure: serverSecure,
                  unknowProcesses: unknowProcesses,
                  onDeleteUnknowProcess: onDeleteUnknowProcess,
                  currentCluster,
                  coreDumps
                }
              )}
            >
              <WarningOutlined
              />
              集群异常
            </span>
          )
        }
      </div>
      <div className="center">
      </div>
      <div className="right">
        {
          oldConsole && (
            <span>
              <a
                href={oldConsole + '?backToOld=true'}
                target="self"
              >
                <RedoOutlined />
                &nbsp;老版本
              </a>
            </span>
          )
        }
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
  currentCluster: PropTypes.object,
  clusterStatus: PropTypes.array,
  coreDumps: PropTypes.array,
  unknowProcesses: PropTypes.array,
  onDeleteUnknowProcess: PropTypes.func
};

export default Header;

