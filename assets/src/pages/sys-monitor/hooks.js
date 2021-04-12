import {useState, useEffect} from 'react';
import {notification} from 'antd';
import moment from 'moment';
import {usageApi} from '@api';

export const useSysUsages = ({
  currentClusterCode,
  filter
}) => {
  const [loading, setLoading] = useState(false);
  const [usages, setUsages] = useState([]);

  /**
   * @param {Object} params 查询参数
   * @param {String} params.time 开始时间
   * @param {String} params.rangeType 时间类型
   * @param {String} params.machine 结束时间
   * @param {String} params.clusterCode 集群code
   */
  const getSysUsages = async (filter) => {
    if (!currentClusterCode) {
      return;
    }

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
    getSysUsages(filter);
  }, [currentClusterCode]);

  return {
    loading, usages, getSysUsages
  };
};

// 简单的更新函数
export const useUpdate = () => {
  const [step, setStep] = useState(0);

  return {
    update: () => {
      setStep(step + 1);
    }
  };
};
