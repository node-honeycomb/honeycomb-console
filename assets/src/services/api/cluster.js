import request from '../request';

// 获取 cluster 列表
export const list = () => {
  return request.get('/api/cluster/list');
};
