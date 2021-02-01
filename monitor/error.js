const urllib = require('urllib');

const logger = require('../common/log');

/**
 * @doc https://developers.dingtalk.com/document/app/custom-robot-access/title-72m-8ag-pqw
 * @param {string} message 错误消息
 */
const getMsg = (message) => {
  return {
    msgtype: 'markdown',
    markdown: {
      title: 'HC警告',
      text: message
    },
    at: {
      isAtAll: true
    }
  };
};

/**
 * 集群错误
 * @param {object} options
 * @param {string} options.clusterCode 集群code
 * @param {string} options.clusterName 集群名称
 * @param {string} options.message 消息
 * @param {string} options.monitor 接收hook的地址
 */
exports.emitClusterError = async ({
  clusterCode,
  clusterName,
  message,
  monitor
}) => {
  let msg = '';
  msg += '# HC集群无响应\n';
  msg += `集群：${clusterName}(${clusterCode})\n\n`;
  msg += `错误原因：${message}`;

  const body = getMsg(msg);
  logger.info(`send err_msg to cluster: ${clusterCode}`);

  try {
    const res = await urllib.request(monitor, {
      method: 'POST',
      data: body,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (res.status !== 200) {
      throw Error(JSON.stringify(res.data));
    }
  } catch (e) {
    logger.error(`send cluster err_msg ${clusterCode} failed`);
    logger.error(e.stack);
  }
};

/**
 * 应用错误
 * @param {object} options
 * @param {string} options.clusterCode 集群code
 * @param {string} options.clusterName 集群名称
 * @param {string[]} options.appIds 集群应用ID
 * @param {string} options.monitor 监控机器人地址
 */
exports.emitAppError = async ({
  clusterCode,
  clusterName,
  appIds,
  monitor
}) => {
  let message = '';
  message += '# HC应用出现异常\n';
  message += `集群：${clusterName}(${clusterCode})\n\n`;
  message += `异常应用：${appIds.join('，')}`;

  const body = getMsg(message);

  logger.info(`send err_msg to cluster: ${clusterCode}, err apps: ${appIds.join(',')}`);

  try {
    const res = await urllib.request(monitor, {
      method: 'POST',
      data: body,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (res.status !== 200) {
      throw Error(JSON.stringify(res.data));
    }
  } catch (e) {
    logger.error(`send apps err_msg ${clusterCode} failed`);
    logger.error(e.stack);
  }
};
