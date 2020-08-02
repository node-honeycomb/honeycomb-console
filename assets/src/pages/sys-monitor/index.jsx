/* eslint-disable no-unused-vars */
import React, {useState, useEffect} from 'react';
import _ from 'lodash';
import {connect} from 'dva';
import CommonTitle from '@coms/common-title';
import {Button, Select} from 'antd';
import BannerCard from '@coms/banner-card';
import TimeRangeSelector from '@coms/timeRangeSelector';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  RedoOutlined,
} from '@ant-design/icons';
import PropTypes from 'prop-types';
import {usageApi} from '@api';
import notification from '@coms/notification';
import moment from 'moment';
import {tryUsageStrToArr} from '@lib/util';
import {__SYSTEM__} from './data';
import TitleCard from './coms/titleCard/index';
import UsageChart from './coms/usageChart/index';

import './index.less';

const SysMonitor = (props) => {
  const {currentClusterCode} = props;
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [usages, setUsages] = useState({});

  const getSysUsages = async (params) => {
    /**  params
     * @param {String} params.from 开始时间
     * @param {String} params.to 结束时间
     * @param {String} params.clusterCode 集群code
     */
    try {
      setLoading(true);
      const data = await usageApi.getAppUsage(params);

      setUsages(data);
    } catch (error) {
      notification.error({
        message: '获取监控信息失败',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentClusterCode) return;
    const values = {
      from: moment()
        .subtract(2, 'hours')
        .format('YYYY-MM-DD-HH-mm'),
      to: moment().format('YYYY-MM-DD-HH-mm'),
      clusterCode: currentClusterCode,
    };

    getSysUsages(values);
  }, [currentClusterCode]);

  const handleDateChange = (data) => {
    /* data : {from, to} */
    console.log('DateChange  ==>', data);
  };

  const handleRunningMonitor = () => {
    setRunning(!running);
  };

  const getOptions = (usages) => {
    return Object.keys(usages).map((item) => {
      const sys = usages[item];

      return (
        <Select.Option value={item} key={item}>
          {`${item}`}
        </Select.Option>
      );
    });
  };

  const getMonitoringCfgs = () => [
    {
      type: 'utilisation',
      title: '系统负载',
      unit: '%',
      legend: ['Utilization'],
      data: tryUsageStrToArr(__SYSTEM__.cpuUsage),
    },
    {
      type: 'utilisation',
      title: 'Memory Utilization',
      unit: '%',
      legend: ['Utilization'],
      data: tryUsageStrToArr(__SYSTEM__.memUsage),
    },
  ];

  return (
    <div>
      <TitleCard title="集群状态监控" des="监控集群的运行状态"></TitleCard>
      <BannerCard>
        <div className="sys-monitor__header">
          <div className="sys-monitor__header__title">{`运行状态`}</div>
          <div className="sys-monitor__header__option">
            <Select
              value={[]}
              placeholder="请选择机器"
              style={{width: '230px', marginRight: '8px'}}
            >
              {getOptions(usages)}
            </Select>
            <TimeRangeSelector onChange={handleDateChange} />
            <div className="action__button" onClick={handleRunningMonitor}>
              {running ? (
                <PauseCircleOutlined style={{fontSize: '20px'}} />
              ) : (
                <PlayCircleOutlined style={{fontSize: '20px'}} />
              )}
            </div>
            <div className="action__button">
              <RedoOutlined style={{fontSize: '20px'}} />
            </div>
          </div>
        </div>
        <div className="sys-monitor__container">
          {getMonitoringCfgs().map((config) => {
            return (
              <div key={config.title} className="chart__box">
                <UsageChart usageData={{}} {...config} />
              </div>
            );
          })}
        </div>
      </BannerCard>
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
