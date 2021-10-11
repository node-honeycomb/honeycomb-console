import React from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import {Menu, Dropdown, Tooltip, Tag} from 'antd';
import {
  UserOutlined, CopyOutlined, PauseCircleOutlined,
  LogoutOutlined, InfoCircleOutlined, SettingOutlined,
  BookOutlined, RedoOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';

import WhiteSpace from '@coms/white-space';
import callClusterStatus from '@coms/cluster-status';

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

const getClusterInfoStatus = (statusObjs, coreDump, unknowPro) => {
  const diskCapacityLimit = 0.8;
  const memoryUsageLimit = 80;
  let clusterStatus = 'normal'; // three status: 'normal', 'warning', 'error'
  let memoryWarning = false;
  let isRedWarning = false;

  statusObjs.forEach(status => {
    const serverCa = _.get(status, 'diskInfo.serverRoot.capacity');
    const logCa = _.get(status, 'diskInfo.logsRoot.capacity');

    if (
      (serverCa > diskCapacityLimit - 0.2) ||
        (logCa > diskCapacityLimit - 0.2) ||
        (status.memoryUsage > memoryUsageLimit - 20)
    ) {
      memoryWarning = true;
    }
    if (
      (serverCa > diskCapacityLimit) ||
        (logCa > diskCapacityLimit) ||
        (status.memoryUsage > memoryUsageLimit)
    ) {
      isRedWarning = true;
    }
  });
  const isCoreWarn = _.some(coreDump, core => {
    return core.data && (core.data.length > 0);
  });
  const isUnkWarn = _.some(unknowPro, unkn => {
    return unkn.data && (unkn.data.length > 0);
  });

  if (memoryWarning || isCoreWarn || isUnkWarn) clusterStatus = 'warning';
  if (isRedWarning) clusterStatus = 'error';

  return clusterStatus;
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
    currentCluster, clusters, clusterStatus, coreDumps, unknowProcesses, onDeleteUnknowProcess
  } = props;
  const checkStatus = getClusterInfoStatus(clusterStatus, coreDumps, unknowProcesses);
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
            clusterCode: currentCluster.code,
            clusters: clusters,
            serverSecure: serverSecure,
            unknowProcesses: unknowProcesses,
            onDeleteUnknowProcess: onDeleteUnknowProcess
          })}
          className="menu-item show-cluster-sider">
          {
            checkStatus === 'error' ?
              <span className="error-red"><ExclamationCircleOutlined /> 集群异常</span> :
              <span><PauseCircleOutlined /> 集群信息</span>
          }
        </span>
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
  clusters: PropTypes.array,
  clusterStatus: PropTypes.array,
  coreDumps: PropTypes.array,
  unknowProcesses: PropTypes.array,
  onDeleteUnknowProcess: PropTypes.func
};

export default Header;

