const util = require('util');
const queue = require('queue');

const cfg = require('../config');
const log = require('../common/log');
const Cluster = require('../model/cluster');
const {callremote} = require('../common/utils');
const {emitClusterError, emitAppError} = require('./error');

// 最大容忍错误次数
const maxAllowErrorCount = cfg.monitor.maxAllowErrorCount || 3;
// 默认每 5 分钟扫描一次
const cycle = cfg.monitor.monitorCycle || 1000 * 60 * 5;
const getMonitedClusterCfg = util.promisify(Cluster.getMonitedClusterCfg);

const q = queue({
  autostart: true,
  concurrency: 5,
  timeout: 1000 * 60   // 每一个检测最多1分钟
});

/**
 * 检查当前cluster是否存在异常
 * 1. 异常机器
 * 2. 异常应用 exception
 */
const detectCluster = async (cluster) => {
  let path = '/api/apps';
  const clusterCode = cluster.code;
  const clusterName = cluster.name;
  const monitor = cluster.monitor;

  if (!monitor) {
    return;
  }

  // 请求远端server
  const detectRemote = () => new Promise((res, rej) => {
    callremote(path, cluster, function (err, result) {
      if (err || result.code !== 'SUCCESS') {
        let errMsg = err && err.message || result.message;
        log.error('get apps from servers failed: ', errMsg);

        return rej({
          clusterCode,
          clusterName,
          message: err.message,
          monitor: cluster.monitor,
        });
      }

      let ips = [];
      let apps = [];

      result.data.success.forEach((item) => {
        ips.push(item.ip);
        apps = apps.concat(item.apps);
      });

      const exceptionAppIds = [];

      if (!apps || apps.length === 0) {
        res();

        return;
      }

      /**
       * interface IApp {
       *  appId: string;
       *  name: string;
       *  version: string;
       *  status: string; // online, offline, reloaded, exception ...
       *  ip: string;
       *  [key]: any;
       * }
       */
      for (const app of apps) {
        if (app.status === 'exception') {
          exceptionAppIds.push(app.appId);
        }
      }

      if (!exceptionAppIds || exceptionAppIds.length === 0) {
        res();

        return;
      }

      return rej({
        clusterCode,
        clusterName,
        appIds: exceptionAppIds,
        monitor
      });
    });
  });

  for (let i = 0; i < maxAllowErrorCount + 1; i++) {
    try {
      await detectRemote();
      break;
    } catch (e) {
      log.warn(`detect cluster ${clusterCode} failed, try count: ${i}`);

      if (i !== maxAllowErrorCount) {
        continue;
      }

      if (e.appIds) {
        return emitAppError(e);
      }

      return emitClusterError(e);
    }
  }

  log.info(`detect cluster ${clusterCode} successfully!`);
};

async function detect() {
  const clusters = await getMonitedClusterCfg();

  Object.keys(clusters).forEach(clusterCode => {
    q.push(async () => {
      const cluster = clusters[clusterCode];
      cluster.code = clusterCode;

      await detectCluster(cluster);
    });
  });
}

async function startMonitor() {
  log.info(`begin to monitor all cluster & apps`);

  setInterval(() => {
    detect();
  }, cycle);
}

module.exports = startMonitor;
