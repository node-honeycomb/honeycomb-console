import request from '../request';

// 获取 app 列表
export const appList = (clusterCode) => {
  return request.get('/api/app/list', {params: {clusterCode}});
};
