import React, {useState, useEffect} from 'react';
import Q from 'queue';
import {Spin} from 'antd';
import moment from 'moment';
import {connect} from 'dva';
import PropTypes from 'prop-types';

import api from '@api/index';
import Ring from '@coms/ring';
import {useRequest} from '@lib/hooks';
import BannerCard from '@coms/banner-card';
import useInterval from '@lib/use-interval';
import notification from '@coms/notification';
import _ from 'lodash';
import App from './coms/app';
import Usages, {MODE} from './coms/usages';
import {getClusterUsages, getCurrentWorking, parseUsgae} from './util';

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

const AppDev = (props) => {
  const {currentClusterCode} = props;
  const [appList, setAppList] = useState([]);
  const [errCount, setErrCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [appUsgae, setAppUsgae] = useState({});

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
        description: err.message
      });
    },
    defaultValue: {
      success: []
    }
  }, [currentClusterCode]);

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
  }, 1000 * 2);

  useInterval(() => {
    usageQ.push(getUsage);
  }, 1000 * 60);

  useEffect(() => {
    (async () => {
      setErrCount(0);
      setAppList([]);
      setLoading(true);
      const apps = await getApiList();

      await getUsage(apps);
    })();
  }, [currentClusterCode]);

  const total = appList.length;

  const usages = getClusterUsages(result.success);

  return (
    <div className="app-dev">
      <BannerCard className="app-status">
        <Ring
          all={total}
          part={total / 2}
          title="当前集群应用"
          allTitle="应用总数"
          partTitle="异常应用总数"
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

      <div className="app-div-title">应用列表</div>
      <div className="app-list">
        <BannerCard>
          <Spin className="app-list-spinning" spinning={loading}>
            {
              appList.map((app, ind) => {
                return (
                  <App
                    key={app.name}
                    app={app}
                    usage={appUsgae[app.name] || {}}
                    zIndex={appList.length - ind}
                  />
                );
              })
            }
          </Spin>
        </BannerCard>
      </div>
    </div>
  );
};


AppDev.propTypes = {
  currentClusterCode: PropTypes.string,
};

const mapState2Props = (state) => {
  return {
    currentClusterCode: state.global.currentClusterCode
  };
};

export default connect(mapState2Props)(AppDev);
