import request from '../request';

// 获取 app 列表
export const appList = () => {
  return request.get('/api/app/list');
};
