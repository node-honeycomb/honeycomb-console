import request from '../request';

// 用户登录
export const login = ({ username, password }) => {
  return request.post('/loginAuth', { username, password });
};

// 初始化用户
export const initUser = ({ username, password }) => {
  return request.post('/initUser', { username, password });
};

// 获取用户列表
export const list = () => {
  return request.get('/api/user/list');
};

// 添加用户
export const createUser = ({ name, password }) => {
  return request.post('/api/user/create', { name, password });
};

// 删除用户
export const deleteUser = ({ name }) => {
  return request.post(`/api/user/${name}/delete`);
};
