const prefix = window.CONFIG.prefix;

const PAGES = {
  APP_DEV: `${prefix}/pages/app-dev`,                 // 应用运维
  APP_PUBLISH: `${prefix}/pages/app-publish`,         // 应用发布
  APP_CONFIG: `${prefix}/pages/app-config`,           // 应用配置
  LOG: `${prefix}/pages/log`,                         // 日志查询
  SYS_MONITOR: `${prefix}/pages/sys-monitor`,         // 系统监控
  CLUSTER_MANAGER: `${prefix}/pages/cluster-manager`, // 集群管理
  CLUSTER_AUTH: `${prefix}/pages/cluster-auth`,       // 集群授权
  USER_MANAGER: `${prefix}/pages/user-manager`,       // 系统监控
};

export default PAGES;
