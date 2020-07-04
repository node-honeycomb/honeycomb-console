import _ from 'lodash';

const TRANS = 1024 * 1024 * 1024;

/**
 * 机器状态
 * @param {Array} status
 * @param {String} status.ip
 * @param {Array} status.data
 */
export const getClusterUsages = (status) => {
  return status.map(stt => {
    const {memoryUsage, memory} = stt.data;
    const disk = _.get(stt, 'data.diskInfo.serverRoot.size');
    const ava = _.get(stt, 'data.diskInfo.serverRoot.available');

    return {
      ip: stt.ip,
      totalMem: Number(memory).toFixed(2),
      avaMem: (((100 - memoryUsage) / 100) * memory).toFixed(2),
      totalDisk: (disk / TRANS).toFixed(2),
      avaDisk: (ava / TRANS).toFixed(2)
    };
  });
};
