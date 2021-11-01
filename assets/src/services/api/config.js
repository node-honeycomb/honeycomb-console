import request from '../request';

/**
 * 获取应用配置
 * @param {String} appName 应用名
 * @param {String} clusterCode 集群code
 * @param {String} type 获取类型, app -> 应用 server -> 系统 （默认的两个应用是 common 和 server）
 */
export const getAppConfig = (appName, clusterCode, type) => {
  return request.get(`/api/config/${appName}/get?clusterCode=${clusterCode}&type=${type}`);
};

/**
 * @param {String} appName 应用配置
 * @param {String} appConfig 应用配置
 * @param {String} clusterCode 集群code
 * @param {String} type 应用类型
 */
export const updateAppConfig = (appName, appConfig, clusterCode, type, saveConfig) => {
  return request.post(`/api/config/${appName}/update`, {appConfig, clusterCode, type, saveConfig});
};

/**
 * @param {String} appName 应用配置
 * @param {String} clusterCode 集群code
 */
export const getAppConfigHistory = (appName, clusterCode) => {
  return request.get(`/api/config/${appName}/history?clusterCode=${clusterCode}`);
};
