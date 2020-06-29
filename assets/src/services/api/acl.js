import request from '../request';

// 获取 getAcl 列表
export const aclList = () => {
  return request.get('/api/acl/list');
};

export const createAcl = (data) => {
  return request.post('/api/acl/create', data);
};

export const updateAcl = (code) => {
  return request.post(`/api/acl/${code}/update`, {});
};

export const deleteAcl = (code) => {
  return request.post(`/api/acl/${code}/delete`, {});
};
