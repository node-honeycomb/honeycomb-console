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
 * 获取上传临时文件url
 * @param  {String} file
 */
export const getTmpUploadUrl = async (clusterCode, file) => {
  return request.get(`/api/app/getUploadTmpUrl`, {params: {
    fileName: file.name,
    clusterCode
  }});
};
/**
 * 上传文件到临时上传地址
 */
export const uploadTmpPkg = async (url, file, onProgress) => {
  /*
  const form = new FormData();
  form.append('pkg', file);
  request.put(url, form, {
    headers: {
      'Content-Disposition': `attachment;filename=${encodeURIComponent(file.name)}`,
      'Content-Type': 'application/gzip'
    },
    onUploadProgress: (progressEvt) => {
      const {loaded, total} = progressEvt;

      onProgress(loaded, total);
    }
  });
  */
  const p = new Promise((resolve, reject) => {
    const name = encodeURIComponent(file.name);
    var xhr = new XMLHttpRequest();

    xhr.open('PUT', url, true);
    xhr.setRequestHeader('Content-Disposition', `attachment;filename=${name}`);
    xhr.setRequestHeader('Content-Type', 'application/gzip');
    xhr.upload.addEventListener('progress', event => {
      if (event.lengthComputable) {
        onProgress(event.loaded, event.total);
      }
    });
    xhr.onreadystatechange = function (e) {
      if (this.readyState === 4) {
        if (xhr.status === 200) {
          resolve();
        } else {
          reject(e);
        }
      } else {
        console.log('uploading', e);
      }
    };
    xhr.send(file);
  });

  return p;
};

export const publishTmp = async (clusterCode, fileName) => {
  return request.post(`/api/app/publishThroughTmp`, {clusterCode, file: fileName});
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

/**
 * 清理某一个应用的退出记录
 * @param clusterCode
 * @param appId
 */
export const cleanAppExit = async (clusterCode, appId) => {
  const body = {clusterCode};

  return request.post(`/api/app/${appId}/clean_exit_record`, body);
};
