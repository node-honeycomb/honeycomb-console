/* eslint-disable no-unused-vars */
import React, {useState, useEffect} from 'react';
import _ from 'lodash';
import {connect} from 'dva';
import {Spin} from 'antd';
import moment from 'moment';
import PropTypes from 'prop-types';
import {useRequest} from '@lib/hooks';

import Machine from '@coms/machine';
import {usageApi, clusterApi} from '@api';
import BannerCard from '@coms/banner-card';
import CommonTitle from '@coms/common-title';
import notification from '@coms/notification';

import './index.less';

const SysMonitor = (props) => {
  const {currentClusterCode} = props;
  const [loading, setLoading] = useState(false);
  const [usages, setUsages] = useState({});

  const {result, loading: clusterLoading, error} = useRequest(
    {
      request: async () => {
        if (!currentClusterCode) {
          return {
            success: [],
            error: []
          };
        }

        return await clusterApi.status(currentClusterCode);
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

  if (!currentClusterCode) {
    return null;
  }

  if (clusterLoading) {
    return <Spin spinning>加载中...</Spin>;
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
            <div className="sys-monitor__header">
              <div className="sys-monitor__header__title">{`运行状态`}</div>
              <div className="sys-monitor__header__option">
              </div>
            </div>
            <div className="sys-monitor__container">
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
