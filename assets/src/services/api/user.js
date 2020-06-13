import request from '../request';

// 用户登录
export const login = ({username, password}) => {
  return request.post('/loginAuth', {username, password});
};

// 初始化用户
export const initUser = ({username, password}) => {
  return request.post('/initUser', {username, password});
};
