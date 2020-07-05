import React, {useState} from 'react';
import _ from 'lodash';
import moment from 'moment';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import AdminAppIconTip from '@coms/admin-app-icon-tip';
import {
  Chart, Area,
  Line, Tooltip,
} from 'bizcharts';
import {DeploymentUnitOutlined} from '@ant-design/icons';

import {PRIMARY_COLOR} from '@lib/color';
import WhiteSpace from '@coms/white-space';
import {ADMIN_APP_NAME, ADMIN_APP_CODE, APP_STATUS} from '@lib/consts';

import AppOp from './app-op';
import VersionApp from './version-app';
import {getCurrentWorking, getAppInfo} from '../../util';

import './index.less';

const isVersionExcept = (version) => {
  const clusters = version.cluster;

  let expectWorkerNum = 0;

  // eslint-disable-next-line
  for (const cluster of clusters) {
    expectWorkerNum += cluster.expectWorkerNum || 0;
  }

  return !!expectWorkerNum;
};

/**
 * 统计信息
 * 1. 最近发布
 * 2. 总版本数
 * 3. 在线版本数
 * 4. 异常版本数：（1）机器不同步的发布 （2）有错误日志
 * @param {Object[]} versions
 */
const getStat = (versions) => {
  const total = versions.length;
  const online = versions.filter(version => version.isCurrWorking).length;
  const publishAt = moment(_.last(versions).publishAt).format('YYYY-MM-DD HH:mm:ss');
  let exceptNum = 0;

  // eslint-disable-next-line
  for (const version of versions) {
    if (isVersionExcept(version)) {
      exceptNum++;
    }
  }

  return {
    publishAt: publishAt,
    total: total,
    online: online,
    exception: exceptNum
  };
};

const App = (props) => {
  const {app, usage, zIndex} = props;
  const {name, versions} = app;
  const {publishAt, exception} = getStat(versions);
  const isAdminApp = ADMIN_APP_CODE === name;
  const [isActive, setActive] = useState(false);
  const {memUsage, cpuUsage} = usage || {};

  const workingApp = getCurrentWorking(versions);
  const appInfo = workingApp && getAppInfo(workingApp.appId);
  const version = appInfo && `${appInfo.version}_${appInfo.build}`;
  const appStatus = workingApp && workingApp.cluster.map(c => c.status);
  const isOnline = workingApp && appStatus.includes(APP_STATUS.ONLINE);

  const infos = [
    [
      isAdminApp ?
        (<span>{ADMIN_APP_NAME}<WhiteSpace /><AdminAppIconTip /></span>) :
        name,
      `创建于${publishAt}`
    ],
    [
      isAdminApp ? '默认版本' : version,
      '运行版本'
    ],
    [
      `${exception}`,
      '异常数'
    ]
  ];

  const charts = [
    [
      '内存',
      memUsage || []
    ],
    [
      'cpu',
      cpuUsage || []
    ]
  ];

  return (
    <div
      className={classnames('app', {active: isActive})}
      style={{zIndex: zIndex}}
    >
      <div className="app-info-container" onClick={() => setActive(!isActive)}>
        <div className="app-icon">
          <DeploymentUnitOutlined style={{fontSize: 30, color: isOnline ? undefined : 'grey'}} />
        </div>
        <div className="app-info">
          {
            infos.map(([title, info]) => {
              return (
                <div className="info" key={title}>
                  <div className="info-title">{title}</div>
                  <div className="info-content" title={title}>
                    {info}
                  </div>
                </div>
              );
            })
          }
          {
            charts.map(([title, data]) => {
              return (
                <div
                  className="usage-echarts"
                  key={title}
                >
                  <div className="charts-title">{title}</div>
                  <div className="echarts-box">
                    <Chart
                      height={30}
                      width={200}
                      data={data}
                      autoFit
                      pure
                      scale={{
                        value: {
                          min: 0
                        }
                      }}
                    >
                      <Tooltip shared={false} />
                      <Area
                        position="timestamp*value"
                        color={`l (270) 0:rgba(255, 255, 255, 1) 1:${PRIMARY_COLOR}`}
                      />
                      <Line
                        position="timestamp*value"
                        color={PRIMARY_COLOR}
                      />
                    </Chart>
                  </div>
                </div>
              );
            })
          }
          <div className="info">
            <div className="info-title">操作</div>
            <AppOp status={appStatus || []} showMore />
          </div>
        </div>
      </div>
      <div className="versions">
        {
          _.cloneDeep(versions).reverse().map(versionApp => {
            return (
              <VersionApp
                key={versionApp.appId}
                versionApp={versionApp}
              />
            );
          })
        }
      </div>
    </div>
  );
};

App.propTypes = {
  app: PropTypes.shape({
    name: PropTypes.string,
    versions: PropTypes.arrayOf(PropTypes.shape({

    }))
  }),
  usage: PropTypes.object,
  zIndex: PropTypes.number
};

export default App;

