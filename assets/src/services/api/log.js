import request from '../request';

/**
 * 获取日志列表
 * @param {String} clusterCode 集群code
 */
export const getLogFiles = (clusterCode) => {
  return request.get('/api/log/list', {params: {clusterCode}});
};


/**
 * 获取日志详情
 * @param {Object} params
 * @param {String} params.fileName 文件名
 * @param {String} params.clusterCode 集群code
 */
export const getLogDetail = (params) => {
  return request.get('/api/log', {params});
};
