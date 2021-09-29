const ERR_MAP = {
  'signature not match, please check server-side log': '签名校验失败，请检查填入token或服务端日志 server.yy-mm-dd.log'
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

