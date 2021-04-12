import React, {useState, useEffect} from 'react';
import {Empty} from 'antd';
import moment from 'moment';
import PropTypes from 'prop-types';

import Filter from '../filter';
import SysChart from '../sys-chart';
import {getAppUsage} from '../../util';
import {useSysUsages} from '../../hooks';
import * as storage from '../add-chart/storage';

const AppChart = (props) => {
  const {cardKey, machines, currentClusterCode, apps} = props;

  const [filter, setFilter] = useState({
    machine: [],
    time: moment().startOf('hour'),
    rangeType: 1,
    continuous: false,
    apps: []
  });

  const {
    usages, loading, getSysUsages
  } = useSysUsages({
    currentClusterCode,
    filter
  });

  const onQuery = () => {
    getSysUsages(filter);
  };

  useEffect(() => {
    filter.machine = machines.map(m => m.ip);

    setFilter({...filter});
  }, [machines]);

  useEffect(() => {
    filter.apps = apps || [];
    setFilter({...filter});
  }, []);

  const appSelected = filter.apps.length !== 0;
  let appMemUsage = [];
  let appCpuUsage = [];

  filter.apps.forEach(appId => {
    const cpuData = getAppUsage(usages, appId, 'cpuUsage');
    const memeData = getAppUsage(usages, appId, 'memUsage');

    appCpuUsage = appMemUsage.concat(cpuData);
    appMemUsage = appMemUsage.concat(memeData);
  });

  const transform = item => {
    item.ip = `${item.appName}-${item.ip}`;
  };

  appMemUsage.forEach(transform);
  appCpuUsage.forEach(transform);

  const onSetFilter = (filter) => {
    setFilter(filter);

    storage.update(cardKey, filter.apps);
  };

  return (
    <div id={`sys-monitor-card-${cardKey}`}>
      <h3>监控面板{cardKey}</h3>
      <Filter
        filter={filter}
        setFilter={onSetFilter}
        machines={machines}
        app={true}
        onQuery={onQuery}
        loading={loading}
        currentClusterCode={currentClusterCode}
      />
      {
        appSelected && (
          <div>
            <span className="monitor-chart-title">
            应用CPU负载
            </span>
            <SysChart
              data={appCpuUsage}
              loading={loading}
            />
            <span className="monitor-chart-title">
            应用内存负载
            </span>
            <SysChart
              data={appMemUsage}
              loading={loading}
            />
          </div>
        )
      }
      {
        !appSelected && (
          <Empty description="请选择应用" />
        )
      }
    </div>
  );
};

AppChart.propTypes = {
  cardKey: PropTypes.string,
  machines: PropTypes.array,
  currentClusterCode: PropTypes.string,
  apps: PropTypes.array
};

export default AppChart;
