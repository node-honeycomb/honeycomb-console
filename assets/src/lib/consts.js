export const USER_ROLE = {
  ADMIN: 1,
  USER: 0
};

export const USER_ROLE_TITLE = {
  [USER_ROLE.ADMIN]: '管理员',
  [USER_ROLE.USER]: '用户'
};

export const USER_STATUS = {
  ACTIVE: 1,
  IN_ACTIVE: 0
};

export const USER_STATUS_TITLE = {
  [USER_STATUS.ACTIVE]: '正常',
  [USER_STATUS.IN_ACTIVE]: '失效'
};

// local storage select cluster code
export const LS_LAST_SELECT_CLUSTER_CODE = 'last-cluster-code';

export const LOG_LEVEL = {
  ERROR: 'ERROR',
  WARN: 'WARN',
};

// 管控进程应用名
export const ADMIN_APP_CODE = '__ADMIN__';
export const ADMIN_APP_NAME = '管控应用';

// 匹配应用名 abc_1.1.2_2
export const APP_ID_MATCH = /^(.+)_(\d+\.\d+\.\d+)_(\d+[-\w+]*|-\w+)*/;

// app状态
export const APP_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline'
};
