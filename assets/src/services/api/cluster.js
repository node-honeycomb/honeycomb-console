import request from '../request';

// 获取 cluster 列表
export const list = () => {
  return request.get('/api/cluster/list');
};

// 添加集群
export const create = (data) => {
  return request.post('/api/cluster/create', data);
};

// 删除集群
export const deleteCluster = (code) => {
  return request.post(`/api/cluster/${code}/delete`, {});
};

/**
 * 获取集群状态
 * @param {String} clusterCode 集群code
 */
export const status = (clusterCode) => {
  return request.get(`/api/status`, {params: {clusterCode}});
};

/**
 * 获取cluster的使用信息
 * @param {Object} query
 * @param {String} query.clusterCode
 * @param {String} query.from
 * @param {String} query.to
 */
export const usage = ({
  clusterCode,
  from,
  to
}) => {
  return request.get(`/api/appUsages`, {params: {clusterCode, from, to}});
};
