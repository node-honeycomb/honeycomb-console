const ECODE = {
  NO_PERMISSION: 'NO_PERMISSION',
  LOGIN_FAILED: 'LOGIN_FAILED',
  USER_CREATED: 'USER_CREATED',
  INIT_USER_FAILED: 'INIT_USER_FAILED'
};

const EMSG = {
  NO_PERMISSION: '当前用户没有操作权限，请切换用户重试',
  LOGIN_FAILED: '登录失败！用户名密码不正确或用户已删除',
  QUERY_USER_UFAILED: '查询用户失败！',
  LOGIN_TICKET_EMPTY: '用户名或密码不能为空！',
  USER_NOT_FOUND: '该用户不存在，请联系管理员添加用户！',
  USER_CREATED: '初始用户已经创建，无法再次创建！',
  INIT_USER_FAILED: '初始化用户失败'
};

const SYSTEM_CODE = 'HC';

// 加入 HC 前缀
Object.keys(ECODE).forEach(key => {
  ECODE[key] = `${SYSTEM_CODE}_${key}`;
});

module.exports = {
  ECODE,
  EMSG
};
