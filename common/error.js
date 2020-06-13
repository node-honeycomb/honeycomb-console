const ECODE = {
  NO_PERMISSION: 'HC_NO_PERMISSION',
  LOGIN_FAILED: 'HC_LOGIN_FAILED',
};

const EMSG = {
  NO_PERMISSION: '当前用户没有操作权限，请切换用户重试',
  LOGIN_FAILED: '登录失败！用户名密码不正确或用户已删除',
  QUERY_USER_UFAILED: '查询用户失败！',
  LOGIN_TICKET_EMPTY: '用户名或密码不能为空！',
  USER_NOT_FOUND: '该用户不存在，请联系管理员添加用户！'
};

module.exports = {
  ECODE,
  EMSG
};
