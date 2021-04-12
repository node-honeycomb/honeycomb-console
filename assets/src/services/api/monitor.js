import request from '../request';

/**
 * 获取系统使用情况
 * @param {Object} params
 * @param {String} params.from 开始时间
 * @param {String} params.to 结束时间
 * @param {String} params.clusterCode 集群code
 */
export const getAppUsage = (params) => {
  return request.get('/api/appUsages', {params});
};
