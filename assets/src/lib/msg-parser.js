const MSG_MAP = {
  'cluster config missing': '缺少集群配置，请配置一个集群或者选择集群',
  'Unexpected end of JSON input': '解析服务端JSON数据失败，请刷新重试'
};

/**
 * 解析错误消息到中文
 * @param {String} msg 错误消息
 */
const msgParser = (msg) => {
  return MSG_MAP[msg] || msg;
};

export default msgParser;
