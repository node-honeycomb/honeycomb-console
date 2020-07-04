import React, {useState, useEffect} from 'react';
import {connect} from 'dva';
import PropTypes from 'prop-types';
import Q from 'queue';
import {Spin} from 'antd';

import api from '@api/index';
import Ring from '@coms/ring';
import {useRequest} from '@lib/hooks';
import BannerCard from '@coms/banner-card';
import useInterval from '@lib/use-interval';
import notification from '@coms/notification';

import App from './coms/app';
import {getClusterUsages} from './util';
import Usages, {MODE} from './coms/usages';

import './index.less';

const q = new Q({
  autostart: true,
  concurrency: 1
});

const AppDev = (props) => {
  const {currentClusterCode} = props;
  const [appList, setAppList] = useState([]);
  const [errCount, setErrCount] = useState(0);
  const [loading, setLoading] = useState(true);

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
    } catch (e) {
      setErrCount(errCount + 1);
    } finally {
      setLoading(false);
    }
  };

  useInterval(() => {
    q.push(getApiList);
  }, 1000);

  useEffect(() => {
    setErrCount(0);
    setAppList([]);
    setLoading(true);
    getApiList();
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
          usages.length && (
            <Usages
              mode={MODE.MEM}
              usages={usages}
              loading={statusLoading}
              currentClusterCode={currentClusterCode}
            />
          )
        }

        {
          usages.length && (
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
          <Spin spinning={loading}>
            {
              appList.map(app => {
                return (
                  <App
                    key={app.name}
                    app={app}
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
