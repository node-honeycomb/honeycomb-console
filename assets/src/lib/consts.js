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
