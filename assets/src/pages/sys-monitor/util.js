import _ from 'lodash';
import moment from 'moment';
import {tryUsageStrToArr} from '@lib/util';

export const getAppUsage = (
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

    // 大概显示 100 个点，点太多图表显示效果差
    let chunkSize = 0;

    if (data.length > 150) {
      chunkSize = data.length / 100;
      const chunks = _.chunk(data, chunkSize);

      data = [];

      // eslint-disable-next-line
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
