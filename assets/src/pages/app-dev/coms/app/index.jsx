import React, {useState} from 'react';
import _ from 'lodash';
import moment from 'moment';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {notification, message} from 'antd';
import {Chart, Area, Line, Tooltip} from 'bizcharts';
import AdminAppIconTip from '@coms/admin-app-icon-tip';
import {DeploymentUnitOutlined, LoadingOutlined} from '@ant-design/icons';

import api from '@api/index';
import PAGES from '@lib/pages';
import {isAppLoading} from '@lib/util';
import {PRIMARY_COLOR} from '@lib/color';
import WhiteSpace from '@coms/white-space';
import {ADMIN_APP_NAME, ADMIN_APP_CODE, APP_STATUS} from '@lib/consts';

import VersionApp from './version-app';
import AppOp, {MENU_ACTIONS} from './app-op';
import {getCurrentWorking, getAppInfo} from '../../util';

import './index.less';

const APP_SYMBOL = Symbol('__app__');

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
  const {app, usage, zIndex, currentClusterCode} = props;
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
  const isLoading = isAppLoading(workingApp);

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

  const onAppAction = async (key, appName) => {
    if (!appName) {
      return message.error('没有选择应用，请重新操作!');
    }

    const action = async () => {
      if (appName === APP_SYMBOL) {
        if (workingApp) {
          appName = workingApp.appId;
        } else {
          appName = _.get(versions, '[0].appId');
        }
      }


      switch (key) {
        // 删除app
        case MENU_ACTIONS.DELETE: {
          await api.appApi.del(currentClusterCode, appName);
          break;
        }

        // 重启app
        case MENU_ACTIONS.RELOAD: {
          await api.appApi.reload(currentClusterCode, appName);
          break;
        }

        // 配置app
        case MENU_ACTIONS.CONFIG: {
          // eslint-disable-next-line
          window.open(`${PAGES.APP_CONFIG}?configAppName=${name}&clusterCode=${currentClusterCode}`);
          break;
        }

        // 查看app的日志
        case MENU_ACTIONS.LOG: {
          window.open(`${PAGES.LOG}?appName=${name}&clusterCode=${currentClusterCode}`);
          break;
        }

        // 回滚app
        case MENU_ACTIONS.ROLLBACK: {
          if (!workingApp) {
            return message.warn('没有可以回滚的版本！');
          }

          await api.appApi.stop(currentClusterCode, workingApp.appId);
          break;
        }

        // 启动app
        case MENU_ACTIONS.START: {
          await api.appApi.start(currentClusterCode, appName);
          break;
        }

        // 停止app
        case MENU_ACTIONS.STOP: {
          await api.appApi.stop(currentClusterCode, appName);
          break;
        }

        case MENU_ACTIONS.EXPEND: {
          setActive(!isActive);
          break;
        }

        default:
          return;
      }
    };

    try {
      await action();
      if (![MENU_ACTIONS.EXPEND, MENU_ACTIONS.LOG, MENU_ACTIONS.CONFIG].includes(key)) {
        message.success('操作成功！');
      }
    } catch (e) {
      notification.error({
        message: '操作失败',
        description: e.message
      });
    }
  };

  const style = {fontSize: 30, color: isOnline ? undefined : '#ccc'};

  return (
    <div
      className={classnames('app', {active: isActive})}
      style={{zIndex: zIndex}}
    >
      <div className="app-info-container" onClick={() => setActive(!isActive)}>
        <div className="app-icon">
          {
            !isLoading && (
              <DeploymentUnitOutlined
                style={style}
              />
            )
          }
          {
            isLoading && (
              <LoadingOutlined
                style={style}
              />
            )
          }
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
            <AppOp
              status={appStatus || []}
              showMore
              onClick={(key) => onAppAction(key, APP_SYMBOL)}
              appName={name}
            />
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
                onAppOpClick={(key) => onAppAction(key, versionApp.appId)}
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
  zIndex: PropTypes.number,
  currentClusterCode: PropTypes.string
};

export default App;

