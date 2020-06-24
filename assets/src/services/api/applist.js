import request from '../request';

// 获取应用列表
export const appList = ({clusterCode}) => {
  return request.get(`/api/app/list?clusterCode=${clusterCode}`);
};
