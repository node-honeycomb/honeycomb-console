import request from '../request';

/**
 * 获取当前应用列表
 * @param {String} clusterCode 集群code
 */
export const appList = (clusterCode) => {
  return request.get('/api/app/list', {params: {clusterCode}});
};

/**
 * 重启应用
 * @param {String} clusterCode 集群code
 * @param {String} appName 应用名
 */
export const reload = (clusterCode, appName) => {
  return request.post(`/api/app/${appName}/reload`, {clusterCode});
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
