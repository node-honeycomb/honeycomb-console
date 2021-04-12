import _ from 'lodash';

/**
 * 计算平均的用量
 * @param {Object} usage {memUsage: {timestamp, value}, cpuUsage}
 */
export const getAvgUsage = (usage) => {
  const {memUsage, cpuUsage} = usage;

  let avgMem = 0;
  let avgCpu = 0;

  if (!memUsage || memUsage.length === 0) {
    avgMem = 0;
  } else {
    avgMem = _.sum(memUsage.map(i => i.value)) / memUsage.length;
  }

  if (!cpuUsage || cpuUsage.length === 0) {
    avgCpu = 0;
  } else {
    avgCpu = _.sum(cpuUsage.map(i => i.value)) / cpuUsage.length;
  }

  avgMem = avgMem.toFixed(1);
  avgCpu = avgCpu.toFixed(1);

  return [avgMem, avgCpu];
};

/**
 * 计算用量的走势
 *  0 - 平缓  所有的差都相等，或者波动不超过 5%
 *  1 - 上升  90%的差值呈递增态势，或者波动差值占比不超过 40%
 *  2 - 下降  90%的差值呈递减态势，或者波动差值占比不超过 40%
 *  3 - 波动  不符合上升或者下降的定义，或者波动差值超过 40%
 * @param {Object} usage {memUsage, cpuUsage}
 */
export const getUsageK = (usage) => {
  const {memUsage, cpuUsage} = usage;
  const difference = 5; // 最小差值

  const getK = (cusgae) => {
    if (!cusgae || cusgae.length === 0) {
      return 0;
    } else {
      let upk = 0;
      let downk = 0;

      for (let i = 0; i < cusgae.length - 1; i++) {
        const now = cusgae[i].value;
        const next = cusgae[i + 1].value;
        const gap = next - now;

        if (gap / now >= 0.4) {
          return 3;
        }

        if (next - now > difference) {
          upk++;
        } else if (next - now < (-difference)) {
          downk++;
        }
      }

      if (upk / (upk + downk) > 0.9) {
        return 1;
      }

      if (downk / (upk + downk) > 0.9) {
        return 2;
      }

      if (upk === 0 && downk === 0) {
        return 0;
      }

      return 3;
    }
  };

  return [
    getK(memUsage),
    getK(cpuUsage)
  ];
};
