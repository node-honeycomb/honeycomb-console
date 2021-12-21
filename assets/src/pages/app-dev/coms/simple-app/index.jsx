import React, {useState} from 'react';
import _ from 'lodash';
import moment from 'moment';
import {Link} from 'dva/router';
import PropTypes from 'prop-types';
import {notification, message, Divider} from 'antd';
import {CheckCircleOutlined, PlusSquareOutlined, MinusSquareOutlined} from '@ant-design/icons';


import api from '@api/index';
import PAGES from '@lib/pages';
import {getStatus} from '@lib/util';
import {ADMIN_APP_CODE} from '@lib/consts';


import AppK from './app-k';
import VersionOp from './version-op';
import getProc from './lib/get-proc';
import AppStatus from './app-status';
import VersionExit from './version-exit';
import {MENU_ACTIONS} from '../app/app-op';
import {getCurrentWorking} from '../../util';
import {getAvgUsage, getUsageK} from './lib/calc-usage';

import './index.less';

// 用于获取当前正在运行的app
const APP_SYMBOL = Symbol('__app__');

/**
 * 判断是否含有offline之外的状态
 * @param {Array} versions
 * @returns {Boolean}
 */
const isOfflineMixed = (versions) => {
  // eslint-disable-next-line
  for (const v of versions) {
    const uniqStatus = _.uniq(v.cluster.map(c => c.status));

    if (uniqStatus.length === 1 && uniqStatus[0] === 'offline') {
      return true;
    }
  }

  return false;
};

const SimpleApp = (props) => {
  const {app, zIndex, currentClusterCode, usage, onAppCfg} = props;
  const {name, versions} = app;
  const isAdminApp = ADMIN_APP_CODE === name;
  const [allVisible, setAllVisible] = useState(false);

  const workingApp = getCurrentWorking(versions);
  const [avgMem, avgCpu] = getAvgUsage(usage);
  const [memK, cpuK] = getUsageK(usage);

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

        // 查看app的日志
        case MENU_ACTIONS.LOG: {
          window.open(`${PAGES.LOG}?appName=${name}&clusterCode=${currentClusterCode}`);
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

  const isMixed = isOfflineMixed(versions);

  /**
   * 过滤逻辑
   * 1. 所有的 online 的 app 都必须显示
   * 2. 默认隐藏所有的 offline 的 app
   * 3. 如果全部都是 offline 的 app，那么则全部展示
   */
  const filterApp = (version) => {
    if (allVisible) {
      return true;
    }

    const uniqStatus = _.uniq(version.cluster.map(c => c.status));

    const isOffline = uniqStatus.length === 1 && uniqStatus[0] === 'offline';

    return !isOffline;
  };

  const expandProps = {
    className: 'expand-icon',
    onClick: () => setAllVisible(!allVisible)
  };

  return (
    <div
      className="app simple-app"
      style={{zIndex: zIndex}}
    >
      <div className="app-name">
        <span>{name}</span>
        {
          isMixed &&
          (
            allVisible ?
              <MinusSquareOutlined {...expandProps} /> :
              <PlusSquareOutlined {...expandProps} />
          )
        }
      </div>
      <div className="simple-versions">
        {
          versions.filter(filterApp).map(version => {
            const [work, expect] = getProc(version.cluster);
            const {isCurrWorking, appId} = version;

            return (
              <div className="one-version" key={version.version + version.buildNum}>
                <span className="version">{version.version}_{version.buildNum}</span>
                <span className="proc">
                  {work} / {expect}
                </span>
                <span className="created-time">
                  {
                    moment(version.publishAt).format('YYYY-MM-DD HH:mm')
                  }
                  {
                    isCurrWorking && (
                      <span className="from-now">
                        （{moment(version.publishAt).fromNow()}）
                      </span>
                    )
                  }
                </span>
                <span className="status">
                  <AppStatus
                    isCurrWorking={isCurrWorking}
                    cluster={version.cluster}
                  />
                  {
                    isCurrWorking && <CheckCircleOutlined style={{color: '#389e0d'}} />
                  }
                  <VersionExit
                    version={version}
                    clusterCode={currentClusterCode}
                  />
                </span>
                <span className="mem">
                  {
                    isCurrWorking && (
                      <React.Fragment>
                        {avgMem} mb <AppK appName={name} k={memK} />
                      </React.Fragment>
                    )
                  }
                </span>
                <span className="cpu">
                  {
                    isCurrWorking && (
                      <React.Fragment>
                        {avgCpu} <AppK appName={name} k={cpuK} />
                      </React.Fragment>
                    )
                  }
                </span>
                {
                  !isAdminApp && (
                    <VersionOp
                      status={getStatus(version)}
                      onAction={(action) => onAppAction(action, appId)}
                      appId={appId}
                    />
                  )
                }
              </div>
            );
          })
        }
      </div>
      {
        !isAdminApp && (
          <div className="one-app-op">
            <Link
              to={`${PAGES.SYS_MONITOR}?clusterCode=${currentClusterCode}&app=${name}`}
              className="stop"
              target="_blank"
            >
              监控
            </Link>
            <Divider type="vertical" />
            <a
              className="stop"
              onClick={() => onAppAction(MENU_ACTIONS.LOG, name)}
            >
              日志
            </a>
            <Divider type="vertical" />
            <a className="stop" onClick={() => onAppCfg(name)}>配置</a>
          </div>
        )
      }
    </div>
  );
};

SimpleApp.propTypes = {
  app: PropTypes.shape({
    name: PropTypes.string,
    versions: PropTypes.arrayOf(PropTypes.shape({

    }))
  }),
  usage: PropTypes.object,
  zIndex: PropTypes.number,
  currentClusterCode: PropTypes.string,
  onAppCfg: PropTypes.func
};

export default SimpleApp;

