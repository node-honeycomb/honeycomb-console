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

// 新增集群
export const addCluster = (info) => {
  return request.post(`/api/cluster/create`, info);
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

/**
 * 获取coredump
 * @param {String} clusterCode 集群code
 */
export const getCoredump = (clusterCode) => {
  return request.get(`/api/coredump`, {params: {clusterCode}});
};

/**
 * 获取unknowProcess
 * @param {String} clusterCode 集群code
 */
export const getUnknowProcess = (clusterCode) => {
  return request.get(`/api/unknowProcess`, {params: {clusterCode}});
};

// 删除集群未知进程
export const deleteUnknowProcess = (pid, params) => {
  return request.post(`/api/unknowProcess/${pid}/delete`, params);
};

/**
 * 删除coredump
 * @param {Object}} body
 *        - clusterCode {string}
 *        - files {string[]} 文件名
 * @returns
 */
export const delCoredump = (body) => {
  return request.post(`/api/coredump/delete`, body);
};


/**
 * 获取AppsConfig
 * @param {String} clusterCode 集群code
 */
export const getAppsConfig = (appId, params) => {
  return request.get(`/api/config/${appId}/get`, {params: params});
};

/**
 * 设置AppsConfig
 * @param {String} clusterCode 集群code
 */
export const setAppConfig = (appId, params) => {
  return request.post(`/api/config/${appId}/update`, params);
};


/**
 * 获取当前 cluster 的 snapshot
 */
export const getSnapshot = (clusterCode) => {
  return request.get(`/api/cluster/snapshot/list`, {params: {clusterCode}});
};

/**
 * 删除snapshot
 */
export const deleteSnapshot = (clusterCode, snapshotId) => {
  return request.delete(`/api/cluster/snapshot/delete`, {data: {clusterCode, snapshotId}});
};

