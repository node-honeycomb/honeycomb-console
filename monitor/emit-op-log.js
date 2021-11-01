const urllib = require('urllib');
const Cluster = require('../model/cluster');

const LEVEL_MAP = {
  HIGH_RISK: '高风险',
  RISKY: '中风险',
  LIMIT: '低风险',
  NORMAL: '无风险',
};

const opNameMap = {
  SET_APP_CONFIG: '更新应用配置',
  RESTART_APP: '重启应用',
  RELOAD_APP: '重载应用',
  START_APP: '启动应用',
  STOP_APP: '停止应用',
  PUBLISH_APP: '发布应用',
  DELETE_APP: '删除应用',
  ADD_CLUSTER: '创建集群',
  UPDATE_CLUSTER: '更新集群',
  DELETE_CLUSTER: '删除集群',
  DELETE_COREDUMP: '清理COREDUMP',
  DELETE_UNKNOWPROCESS: '删除未知的process',
  CLEAN_APP_EXIT_RECORD: '清理应用多余版本',
  REMOVE_WORKER: '删除worker',
  ADD_WORKER: '创建worker',
  REGISTER_WORKER: '注册worker',
  DEL_TMP_WORKER: '注销worker',
  LIST_WORKER: '查看worker',
  DEL_WORKER: '删除worker',
};

function msgTemplate(clusterName, username, data) {
  return {
    msgtype: 'markdown',
    markdown: {
      title: 'HC操作通知',
      text: `#### 集群 ${clusterName} 操作通知
> 用户 ${username} **${opNameMap[data.opName]}** ${data.opItemId || ''}

> 该操作为 **${LEVEL_MAP[data.opLogLevel]}** 操作`
    },
    at: {
      isAtAll: ['HIGH_RISK'].includes(data.opLogLevel)
    }
  };
}

module.exports = function (clusterCode, username, data) {
  Cluster.getClusterMonitorByCode(clusterCode, function (err, result) {
    if (!err) {
      const monitor = result[0] && result[0].monitor;
      const clusterName = result[0] && result[0].name;

      if (monitor) {
        urllib.request(monitor, {
          method: 'POST',
          data: msgTemplate(clusterName, username, data),
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
    }
  });
};

