import React from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import {Tooltip} from 'antd';
import WhiteSpace from '@coms/white-space';
import {
  BorderlessTableOutlined, CheckCircleOutlined,
  InfoCircleOutlined, LoadingOutlined
} from '@ant-design/icons';

import {APP_STATUS} from '@lib/consts';
import {getStatus, isSameStatus, isAppLoading} from '@lib/util';

import AppOp from './app-op';

const wokerTitle = () => {
  return (
    <div>
      处理worker：n/m
      <br />
      处理worker中的分母意味着在当前集群中应该有m个运行的app子进程实例
      <br />
      但实际只运行了n个app子进程实例
    </div>
  );
};


// 获取woker的比例
const getProWokerRatio = (versionApp) => {
  let workerNum = 0;
  let expectWorkerNum = 0;

  if (getStatus(versionApp)[0] !== APP_STATUS.ONLINE) {
    return '0/0';
  }

  // eslint-disable-next-line
  for (const app of versionApp.cluster) {
    workerNum += app.workerNum;
    expectWorkerNum += app.expectWorkerNum;
  }

  return `${workerNum}/${expectWorkerNum}`;
};

const COLOR_MAP = {
  [APP_STATUS.ONLINE]: 'green',
  [APP_STATUS.OFFLINE]: 'grey',
};


const renderStatus = (status, ip) => {
  return (
    <div>{ip} {status}</div>
  );
};

const renderAppStatus = (versionApp) => {
  if (isSameStatus(versionApp)) {
    return renderStatus(getStatus(versionApp)[0]);
  }

  const {cluster} = versionApp;

  return cluster.map(c => {
    return renderStatus(c.status, c.ip);
  });
};

const VersionApp = (props) => {
  const {versionApp, onAppOpClick, isAdminApp} = props;
  const {appId, publishAt, isCurrWorking} = versionApp;
  const appStatus = getStatus(versionApp);

  const infos = [
    [
      appId,
      'app id'
    ],
    [
      getProWokerRatio(versionApp),
      <span key="worker">
          处理worker<WhiteSpace />
        <Tooltip title={wokerTitle}>
          <InfoCircleOutlined />
        </Tooltip>
      </span>
    ],
    [
      moment(publishAt).format('YYYY-MM-DD HH:mm:ss'),
      '发布时间'
    ],
    [
      renderAppStatus(versionApp),
      '状态'
    ],
    [
      '操作',
      isAdminApp && <AppOp
        key="op"
        status={appStatus}
        appName={appId}
        onClick={onAppOpClick}
      />
    ]
  ];

  const iconStyle = {fontSize: 30, color: COLOR_MAP[appStatus[0]]};
  const isLoading = isAppLoading(versionApp);

  const getIcon = () => {
    if (isLoading) {
      return <LoadingOutlined style={iconStyle} />;
    }

    if (isCurrWorking) {
      return <CheckCircleOutlined style={iconStyle} />;
    }

    return <BorderlessTableOutlined style={iconStyle} />;
  };

  return (
    <div className="version-app" key={versionApp.appId}>
      <div className="app-icon">
        {
          getIcon()
        }
      </div>
      <div className="version-app-info">
        {
          infos.map(([title, info]) => {
            return (
              <div className="info" key={title}>
                <div className="info-title">{title}</div>
                <div className="info-content">
                  {info}
                </div>
              </div>
            );
          })
        }
      </div>
    </div>
  );
};

VersionApp.propTypes = {
  versionApp: PropTypes.shape({
    appId: PropTypes.string,
    cluster: PropTypes.array,
    publishAt: PropTypes.string,
    isCurrWorking: PropTypes.bool
  }),
  onAppOpClick: PropTypes.func,
  isAdminApp: PropTypes.bool
};

export default VersionApp;

