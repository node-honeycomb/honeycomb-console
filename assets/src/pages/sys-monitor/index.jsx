import React, {useState} from 'react';
import _ from 'lodash';
import {connect} from 'dva';
import moment from 'moment';
import PropTypes from 'prop-types';
import {Spin, Tooltip} from 'antd';
import {useRequest} from '@lib/hooks';
import scrollIntoView from 'scroll-into-view';
import {InfoCircleOutlined} from '@ant-design/icons';

import {clusterApi} from '@api';
import Machine from '@coms/machine';
import {SYS_CPU_TIPS} from '@lib/consts';
import BannerCard from '@coms/banner-card';
import CommonTitle from '@coms/common-title';
import notification from '@coms/notification';

import {getAppUsage} from './util';
import Filter from './coms/filter';
import AddChart from './coms/add-chart';
import SysChart from './coms/sys-chart';
import AppChart from './coms/app-chart';
import {useSysUsages, useUpdate} from './hooks';
import * as storage from './coms/add-chart/storage';

import './index.less';


const SYS_MEM_TIPS = '由free计算，为内存使用百分比';


const getTips = (title) => {
  return (
    <Tooltip title={title}>
      <InfoCircleOutlined />
    </Tooltip>);
};

const SysMonitor = (props) => {
  const {currentClusterCode} = props;
  const [filter, setFilter] = useState({
    machine: [],
    time: moment().startOf('hour'),
    rangeType: 1,
    continuous: false
  });

  const {update} = useUpdate();

  storage.on(update);

  const {result, loading: clusterLoading} = useRequest(
    {
      request: async () => {
        if (!currentClusterCode) {
          return {
            success: [],
            error: []
          };
        }

        const r = await clusterApi.status(currentClusterCode);

        filter.machine = r.success.map(i => i.ip);
        setFilter(filter);

        return r;
      },
      onError: (error) => {
        notification.error({
          message: '获取集群信息失败',
          description: error.message
        });
      },
      defaultValue: {
        success: [],
        error: []
      }
    }
    , [currentClusterCode]
  );

  const {loading, usages, getSysUsages} = useSysUsages({
    currentClusterCode,
    filter
  });

  const onSelect = (cardKey) => {
    const id = `sys-monitor-card-${cardKey}`;

    scrollIntoView(document.getElementById(id));
  };

  if (!currentClusterCode) {
    return null;
  }

  if (clusterLoading) {
    return <Spin style={{width: '100%', textAlign: 'center'}} spinning />;
  }

  const cards = storage.list();
  const machines = result.success;

  return (
    <div
      className="sys-monitor"
      id="sys-monitor"
    >
      <CommonTitle>系统监控</CommonTitle>
      <div className="main-container">
        <div className="left-machines">
          <div className="list-title">机器列表</div>
          {
            machines.map(m => {
              return (
                <Machine key={m.ip} {...m} />
              );
            })
          }
          <AddChart onSelect={onSelect} />
        </div>
        <div className="right-monitor">
          {
            cards.map(card => {
              return (
                <BannerCard
                  key={card.key}
                  className="sys-monitor-app-card"
                  style={{
                    borderTopColor: card.color
                  }}
                >
                  <AppChart
                    cardKey={card.key}
                    machines={machines}
                    currentClusterCode={currentClusterCode}
                    apps={card.apps}
                  />
                </BannerCard>
              );
            })
          }
          <BannerCard>
            <Filter
              filter={filter}
              setFilter={setFilter}
              loading={loading}
              machines={machines}
              onQuery={() => getSysUsages(filter)}
            />
            <div>
              <span className="monitor-chart-title">
                系统CPU负载 {getTips(SYS_CPU_TIPS)}
              </span>
              <SysChart
                data={getAppUsage(usages, '__SYSTEM__', 'cpuUsage')}
                loading={loading}
              />
              <span className="monitor-chart-title">
                系统内存负载(%) {getTips(SYS_MEM_TIPS)}
              </span>
              <SysChart
                data={getAppUsage(usages, '__SYSTEM__', 'memUsage')}
                loading={loading}
              />
            </div>
          </BannerCard>
        </div>
      </div>
    </div>
  );
};

SysMonitor.propTypes = {
  currentClusterCode: PropTypes.string,
};

const mapStateProps = (state) => {
  const currentClusterCode = _.get(state, 'global.currentClusterCode');

  return {
    currentClusterCode,
  };
};

export default connect(mapStateProps)(SysMonitor);
