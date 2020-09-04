import React from 'react';
import _ from 'lodash';
import moment from 'moment';
import PropTypes from 'prop-types';
import {Tooltip} from 'antd';
import WhiteSpace from '@coms/white-space';
import {BorderlessTableOutlined, CheckCircleOutlined, InfoCircleOutlined} from '@ant-design/icons';

import {APP_STATUS} from '@lib/consts';

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

const getStatus = (versionApp) => {
  const {cluster} = versionApp;

  return cluster.map(c => c.status);
};

// 判断一个 version 的版本是否相同
const isSameStatus = (versionApp) => {
  return _.uniq(getStatus(versionApp)).length === 1;
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
  const {versionApp} = props;
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
      <AppOp key="op" status={appStatus} />
    ]
  ];

  const iconStyle = {fontSize: 30, color: COLOR_MAP[appStatus[0]]};

  return (
    <div className="version-app" key={versionApp.appId}>
      <div className="app-icon">
        {
          isCurrWorking ?
            (<CheckCircleOutlined style={iconStyle} />) :
            (<BorderlessTableOutlined style={iconStyle} />)
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
  })
};

export default VersionApp;

