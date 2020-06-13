import request from '../request';

// 用户登录
export const login = ({username, password}) => {
  return request.post('/loginAuth', {username, password});
};
