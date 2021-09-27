/* eslint-disable max-len */
const ERR_MAP = {
  'signature not match, please check server-side log': '签名校验失败，请检查填入token或服务端日志 server.yy-mm-dd.log',
  'Connect timeout for 15000ms': '获取状态超时，当前超时时间为15s, 请进入机器内执行 ps -ef | grep admin 检查进程状态，必要时可重启honeycomb-server'
};

export const getErrMsg = (msg) => {
  if (!msg) {
    return msg;
  }

  let title = msg;

  Object.keys(ERR_MAP).forEach(key => {
    if (msg.includes(key)) {
      title = ERR_MAP[key];
    }
  });

  return title;
};

