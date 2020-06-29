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
