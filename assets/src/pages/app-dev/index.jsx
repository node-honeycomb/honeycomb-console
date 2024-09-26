import React, {useState, useEffect} from 'react';
import Q from 'queue';
import _ from 'lodash';
import moment from 'moment';
import {connect} from 'dva';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {withRouter} from 'dva/router';
import {Spin, Tooltip, Menu, Dropdown, Drawer, Modal} from 'antd';
import {SettingOutlined, DeleteOutlined, CheckCircleOutlined} from '@ant-design/icons';

import api from '@api/index';
import Ring from '@coms/ring';
import PAGES from '@lib/pages';
import {useRequest} from '@lib/hooks';
import {getErrMsg} from '@lib/error-msg';
import BannerCard from '@coms/banner-card';
import WhiteSpace from '@coms/white-space';
import useInterval from '@lib/use-interval';
import notification from '@coms/notification';
import EditAppConfig from '@coms/edit-app-config';

import OnlineListModal from './coms/online-list-modal';
import App from './coms/app';
import SimpleApp from './coms/simple-app';
import Usages, {MODE} from './coms/usages';
import SimpleTitle from './coms/simple-title';
import AppChart from '../sys-monitor/coms/app-chart';
import {
  getClusterUsages,
  getCurrentWorking,
  parseUsgae,
  getAppExpceptStatistics,
  setClearPolicy,
  genClearList
} from './util';

import './index.less';

const appQ = new Q({
  autostart: true,
  concurrency: 1
});

const usageQ = new Q({
  autostart: true,
  concurrency: 1
});

const now = moment().format('YYYY-MM-DD-HH');
const before = moment().format('YYYY-MM-DD-HH');
const ok = () => <CheckCircleOutlined style={{color: 'green'}} />;

const AppDev = (props) => {
  const {currentClusterCode, location} = props;
  const [appList, setAppList] = useState([]);
  const [errCount, setErrCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [appUsgae, setAppUsgae] = useState({});
  const [isSimple, setIsSimple] = useState(localStorage.getItem('isSimple') || true);
  const [cfgAppName, setCfgAppName] = useState(null);
  const [clearListVisible, setClearListVisible] = useState(false);


  const isActive = location.pathname === PAGES.APP_DEV;

  const {result, loading: statusLoading} = useRequest({
    request: async () => {
      if (!currentClusterCode) {
        return [];
      }

      return await api.clusterApi.status(currentClusterCode);
    },
    onError: (err) => {
      notification.error({
        message: '获取集群状态失败',
        description: getErrMsg(err.message)
      });
    },
    defaultValue: {
      success: []
    }
  }, [currentClusterCode]);

  // ======================================= 获取应用列表 =======================================
  const getApiList = async () => {
    if (!currentClusterCode) {
      return;
    }

    try {
      const {success} = await api.appApi.appList(currentClusterCode);

      setAppList(success);

      return success;
    } catch (e) {
      setErrCount(errCount + 1);
    } finally {
      setLoading(false);
    }
  };

  // ======================================= 获取用量列表 =======================================
  const getUsage = async (apps = appList) => {
    if (!currentClusterCode) {
      return;
    }

    try {
      const usageResult = await api.clusterApi.usage({
        clusterCode: currentClusterCode,
        from: before,
        to: now
      });

      const keys = Object.keys(usageResult);
      const usage = {};
      const statUsage = usageResult[keys[0]];

      apps.forEach(app => {
        const workingApp = getCurrentWorking(app.versions);
        const appId = workingApp && workingApp.appId;

        usage[app.name] = parseUsgae(statUsage[appId]);
      });

      // TODO: 只取出第一个机器的信息，其他机器的信息引导用户去系统监控查看
      setAppUsgae(usage);
    } catch (e) {
      setErrCount(errCount + 1);
    }
  };

  useInterval(() => {
    appQ.push(getApiList);
  }, isActive ? 1000 * 2 : null);

  useInterval(() => {
    usageQ.push(getUsage);
  }, isActive ? 1000 * 60 : null);

  // ======================================= 初始化 =======================================
  useEffect(() => {
    (async () => {
      setErrCount(0);
      setAppList([]);
      setLoading(true);
      const apps = await getApiList();

      if (currentClusterCode) {
        if (Object.keys(setClearPolicy(genClearList(apps))).length) {
          setClearListVisible(true);
        }
      }

      // if (currentClusterCode) {
      api.clusterApi.fixCluster(currentClusterCode);
      // }

      await getUsage(apps);
    })();
  }, [currentClusterCode]);

  const usages = getClusterUsages(result.success);

  const menu = (
    <Menu onClick={() => setIsSimple(!isSimple)}>
      <Menu.Item key="simple">
        简洁模式<WhiteSpace />{isSimple && ok()}
      </Menu.Item>
      <Menu.Item key="standard">
        标准模式<WhiteSpace />{!isSimple && ok()}
      </Menu.Item>
    </Menu>
  );

  const [isAppUsageModalOpen, setIsAppUsageModalOpen] = useState(false);
  const [appUsageAppId, setAppUsageAppId] = useState([]);
  const cancelAppUsageModal = () => {
    setIsAppUsageModalOpen(false);
  };

  const {total: totalVersion, errorCount, errorApps} = getAppExpceptStatistics(appList);

  return (
    <div
      className={
        classnames({
          'app-dev': true,
          active: isActive,
        })
      }
    >
      <BannerCard className="app-status">
        <Ring
          all={totalVersion}
          part={errorCount}
          anotherTitle="正常应用总数"
          title="异常应用"
          allTitle="应用总数"
          partTitle="异常应用"
          partTooltip={(
            <span>
              {
                errorApps.join('，')
              }
            </span>
          )}
        />
        {
          _.get(usages, 'length') && (
            <Usages
              mode={MODE.MEM}
              usages={usages}
              loading={statusLoading}
              currentClusterCode={currentClusterCode}
            />
          )
        }

        {
          _.get(usages, 'length') && (
            <Usages
              mode={MODE.DISK}
              usages={usages}
              loading={statusLoading}
              currentClusterCode={currentClusterCode}
            />
          )
        }
      </BannerCard>

      <div className="app-div-title">
        应用列表
        <WhiteSpace /><WhiteSpace /><WhiteSpace /><WhiteSpace />
        <Dropdown overlay={menu}>
          <SettingOutlined />
        </Dropdown>
        <WhiteSpace /><WhiteSpace />
        <Tooltip title="应用清理">
          <DeleteOutlined onClick={() => setClearListVisible(true)} />
        </Tooltip>
      </div>
      <div className="app-list">
        <BannerCard>
          {
            isSimple && <SimpleTitle />
          }
          <Spin className="app-list-spinning" spinning={loading}>
            {
              appList.map((app, ind) => {
                const props = {
                  key: app.name,
                  app: app,
                  setAppUsageAppId,
                  setIsAppUsageModalOpen,
                  usage: appUsgae[app.name] || {},
                  zIndex: appList.length - ind,
                  currentClusterCode: currentClusterCode,
                  onAppCfg: (appName) => {
                    setCfgAppName(appName);
                  }
                };

                return (
                  isSimple ?
                    <SimpleApp {...props} /> :
                    <App {...props} />
                );
              })
            }
          </Spin>
        </BannerCard>
      </div>
      <Modal title="App Usage" width={700} visible={isAppUsageModalOpen} onOk={cancelAppUsageModal} onCancel={cancelAppUsageModal}>
        <AppChart
          cardKey={appUsageAppId[0]}
          currentClusterCode={currentClusterCode}
          apps={appUsageAppId}
        />
      </Modal>
      <OnlineListModal
        visible={clearListVisible}
        onClose={() => setClearListVisible(false)}
        currentClusterCode={currentClusterCode}
      />
      <Drawer
        visible={!!cfgAppName}
        onClose={() => setCfgAppName(null)}
        width="50%"
        forceRender
      >
        <EditAppConfig
          appName={cfgAppName}
        />
      </Drawer>
    </div>
  );
};


AppDev.propTypes = {
  currentClusterCode: PropTypes.string,
  location: PropTypes.shape({
    pathname: PropTypes.string
  })
};

const mapState2Props = (state) => {
  return {
    currentClusterCode: state.global.currentClusterCode
  };
};

export default withRouter(connect(mapState2Props)(AppDev));
