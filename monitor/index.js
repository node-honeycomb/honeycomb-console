const util = require('util');
const queue = require('queue');

const cfg = require('../config');
const log = require('../common/log');
const Cluster = require('../model/cluster');
const {callremote} = require('../common/utils');
const {emitClusterError, emitAppError} = require('./error');

// 默认每 5 分钟扫描一次
const cycle = cfg.monitorCycle || 1000 * 60 * 5;
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
const detectClusters = (cluster) => {
  let path = '/api/apps';
  const clusterCode = cluster.code;
  const clusterName = cluster.name;
  const monitor = cluster.monitor;

  if (!monitor) {
    return;
  }

  return new Promise((res, rej) => {
    callremote(path, cluster, function (err, result) {
      if (err || result.code !== 'SUCCESS') {
        let errMsg = err && err.message || result.message;
        log.error('get apps from servers failed: ', errMsg);

        emitClusterError({
          clusterCode,
          clusterName,
          message: err.message,
          monitor: cluster.monitor,
        });

        return rej(err);
      }

      let ips = [];
      let apps = [];

      result.data.success.forEach((item) => {
        ips.push(item.ip);
        apps = apps.concat(item.apps);
      });

      const exceptionAppIds = [];

      if (!apps || apps.length === 0) {
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
        return;
      }

      return emitAppError({
        clusterCode,
        clusterName,
        appIds: exceptionAppIds,
        monitor
      });
    });
  });
};

async function detect() {
  const clusters = await getMonitedClusterCfg();

  Object.keys(clusters).forEach(clusterCode => {
    q.push(async () => {
      const cluster = clusters[clusterCode];
      cluster.code = clusterCode;

      return detectClusters(cluster);
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
