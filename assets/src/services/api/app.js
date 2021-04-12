import request from '../request';

/**
 * 获取当前应用列表
 * @param {String} clusterCode 集群code
 */
export const appList = (clusterCode) => {
  return request.get('/api/app/list', {params: {clusterCode}});
};

/**
 * 获取当前工作的应用的版本ID
 * @param {String} clusterCode
 * @param {String} appName
 * @returns {Promise<String>}
 */
export const getWorkingAppId = async (clusterCode, appName) => {
  const result = await appList(clusterCode);

  if (!result || !result.success) {
    return null;
  }

  const list = result.success;
  const appVersions = list.find(item => item.name === appName);

  if (!appVersions) {
    return null;
  }

  const v = appVersions.versions.find(v => v.isCurrWorking);

  if (!v) {
    return null;
  }

  return v.appId;
};

/**
 * 重启应用
 * @param {String} clusterCode 集群code
 * @param {String} appId 应用ID
 */
export const reload = (clusterCode, appId) => {
  return request.post(`/api/app/${appId}/reload`, {clusterCode});
};

// 启动 app
export const start = (clusterCode, appName) => {
  return request.post(`/api/app/${appName}/start`, {clusterCode});
};

// 停止app
export const stop = (clusterCode, appName) => {
  return request.post(`/api/app/${appName}/stop`, {clusterCode});
};

// 删除app
export const del = (clusterCode, appName) => {
  return request.post(`/api/app/${appName}/delete`, {clusterCode});
};

/**
 * 上传发布应用
 * @param {String} clusterCode 集群code
 * @param {File} file 需要发布应用
 * @param {Function} onProgress 发布中的回调函数
 */
export const upload = async (clusterCode, file, onProgress) => {
  const params = {
    clusterCode,
  };


  const form = new FormData();

  form.append('pkg', file);

  return request.post(`/api/app/publish`, form, {params,
    onUploadProgress: (progressEvt) => {
      const {loaded, total} = progressEvt;

      onProgress(loaded, total);
    }
  });
};
