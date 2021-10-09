import request from '../request';

/**
 * 获取日志列表
 * @param {Number} startTime 开始时间
 * @param {Number} endTime   结束时间
 */
export const queryOpLog = (clusterCode, startTime, endTime) => {
  return request.get('/api/oplog', {params: {clusterCode, startTime, endTime}});
};
