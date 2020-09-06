/* eslint-disable no-unused-vars */
import React, {useState, useEffect} from 'react';
import _ from 'lodash';
import {connect} from 'dva';
import moment from 'moment';
import PropTypes from 'prop-types';
import {useRequest} from '@lib/hooks';
import {InfoCircleOutlined} from '@ant-design/icons';
import {Spin, DatePicker, Select, Button, Switch, Tooltip} from 'antd';

import Machine from '@coms/machine';
import {usageApi, clusterApi} from '@api';
import {tryUsageStrToArr} from '@lib/util';
import BannerCard from '@coms/banner-card';
import CommonTitle from '@coms/common-title';
import notification from '@coms/notification';

import SysChart from './coms/sys-chart';

import './index.less';

const Option = Select.Option;

const getAppUsage = (
  usage,
  appName,
  type = 'cpuUsage',
  rangeType = 1     // 最近1小时
) => {
  try {
    let data = [];

    Object.keys(usage).forEach(ip => {
      if (rangeType === 1) {
        let usageData = '';

        if (Array.isArray(usage[ip][appName][type])) {
          usageData = usage[ip][appName][type].join(';');
        } else {
          usageData = usage[ip][appName][type];
        }

        tryUsageStrToArr(usageData).forEach(item => {
          data.push({
            ...item,
            ip: ip,
            appName: appName,
          });
        });
      }
    });

    console.log(data);

    // 大概显示 100 个点，点太多图表显示效果差
    let chunkSize = 0;

    if (data.length > 150) {
      chunkSize = data.length / 100;
      const chunks = _.chunk(data, chunkSize);

      data = [];

      for (const chunk of chunks) {
      // 计算每个chunk的平均值
        const item = chunk[0];
        const value = _.sum(chunk.map(c => c.value)) / chunk.length;

        item.value = value;
        data.push(item);
      }
    }

    // 数据按照时间排序

    data = data.sort((a, b) => {
      return Number(moment(a.time, 'HH:mm:ss')) - Number(moment(b.time, 'HH:mm:ss'));
    });

    return data;
  } catch (e) {
    console.error('解析数据失败', e.stack);

    return [];
  }
};

const SYS_CPU_TIPS = (
  <span>
  由
    <a
      rel="noreferrer"
      href="http://nodejs.cn/api/os.html#os_os_loadavg"
      target="_blank"
    >
      os.loadavg()[0]
    </a>
  计算得出，每5s收集一次
  </span>
);
const SYS_MEM_TIPS = '由free计算，为内存使用百分比';


const getTips = (title) => {
  return (
    <Tooltip title={title}>
      <InfoCircleOutlined />
    </Tooltip>);
};

const SysMonitor = (props) => {
  const {currentClusterCode} = props;
  const [loading, setLoading] = useState(false);
  const [usages, setUsages] = useState({});
  const [filter, setFilter] = useState({
    machine: [],
    time: moment().startOf('hour'),
    rangeType: 1,
    continuous: false
  });

  const onSetFilter = (key) => {
    return (value) => {
      filter[key] = value;
      setFilter({...filter});
    };
  };

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

  /**
   * @param {Object} params 查询参数
   * @param {String} params.time 开始时间
   * @param {String} params.rangeType 时间类型
   * @param {String} params.machine 结束时间
   * @param {String} params.clusterCode 集群code
   */
  const getSysUsages = async (filter) => {
    try {
      const fmt = 'YYYY-MM-DD-HH-mm';

      const params = {
        from: moment(filter.time).format(fmt),
        to: moment(filter.time).add(filter.rangeType, 'hour').format(fmt),
        clusterCode: currentClusterCode
      };

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

    getSysUsages(filter);
  }, [currentClusterCode]);

  if (!currentClusterCode) {
    return null;
  }

  if (clusterLoading) {
    return <Spin style={{width: '100%', textAlign: 'center'}} spinning />;
  }

  return (
    <div className="sys-monitor">
      <CommonTitle>系统监控</CommonTitle>
      <div className="main-container">
        <div className="left-machines">
          <div className="list-title">机器列表</div>
          {
            result.success.map(m => {
              return (
                <Machine key={m.ip} {...m} />
              );
            })
          }
        </div>
        <div className="right-monitor">
          <BannerCard>
            <div className="filter-content">
              <div className="filter">
                查询时间：
                <DatePicker
                  showTime={{format: 'HH'}}
                  value={filter.time}
                  onChange={onSetFilter('time')}
                  format="YYYY-MM-DD HH"
                />
                &nbsp;&nbsp;
                <Select
                  value={filter.rangeType}
                  onChange={onSetFilter('rangeType')}
                  style={{width: 100}}
                >
                  {
                    [1, 2, 3].map(r => {
                      return (
                        <Option key={r} value={r}>
                          {r}小时
                        </Option>
                      );
                    })
                  }
                </Select>
              </div>
              <div className="filter">
                选择机器：
                <Select
                  style={{width: 200}}
                  mode="multiple"
                  value={filter.machine}
                  onChange={onSetFilter('machine')}
                  disabled
                >
                  {
                    result.success.map(m => {
                      return (
                        <Option key={m.ip} value={m.ip}>
                          {m.ip}
                        </Option>
                      );
                    })
                  }
                </Select>
              </div>
              <div className="filter">
                持续刷新：
                <Switch
                  disabled
                  checked={filter.continuous}
                  size="small"
                  onChange={(e) => {
                    return onSetFilter('continuous')(e.target.value);
                  }}
                />
              </div>
              <div className="button">
                <Button
                  type="primary"
                  loading={loading}
                  onClick={() => getSysUsages(filter)}
                >
                  查询
                </Button>
              </div>
            </div>
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
