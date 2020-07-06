import request from '../request';

// 获取 getAcl 列表
export const aclList = () => {
  return request.get('/api/acl/list');
};

export const createAcl = (data) => {
  return request.post('/api/acl/create', {...data});
};

export const updateAcl = (id, data) => {
  return request.post(`/api/acl/${id}/update`, data);
};

export const deleteAcl = (id, data) => {
  return request.post(`/api/acl/${id}/delete`, data);
};
