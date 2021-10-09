import _ from 'lodash';
import moment from 'moment';
import {APP_ID_MATCH} from '@lib/consts';

const TRANS = 1024 * 1024 * 1024;
const keepOnlineNum = _.get(window, ['appManageConfig', 'keepOnlineNum']) || 3; // 保留的在线版本数量
const keepOfflineNum = _.get(window, ['appManageConfig', 'keepOfflineNum']) || 5; // 保留的离线版本数量

export const setClearPolicy = (data) => {
  _.map(data, (value) => {
    // eslint-disable-next-line array-callback-return
    const onlineList = value.filter((item) => {
      if (_.get(item, 'cluster[0].status') === 'online') {
        return item;
      }
    });
    // eslint-disable-next-line array-callback-return
    const offlineList = value.filter((item) => {
      if (_.get(item, 'cluster[0].status') === 'offline') return item;
    });

    let keepOnlineIdx = onlineList.length - keepOnlineNum;
    let keepOfflineIdx = offlineList.length - keepOfflineNum;

    // 在线版本数未达到上限则全部保留
    if (keepOnlineIdx < 0) {
      keepOnlineIdx = 0;
    }
    onlineList.slice(keepOnlineIdx).map(d => {
      d.isKeepOnline = true;

      return d;
    });
    if (keepOfflineIdx < 0) {
      keepOfflineIdx = 0;
    }
    offlineList.slice(keepOfflineIdx).map(d => {
      d.isKeepOffline = true;

      return d;
    });
  });

  return data;
};

export const genClearList = (value) => {
  const clearList = {};

  (value || []).forEach(data => {
    // eslint-disable-next-line array-callback-return
    const _onlineList = data.versions.filter((item) => {
      if (_.get(item, 'cluster[0].status') === 'online') return item;
    });
    // eslint-disable-next-line array-callback-return
    const _offlineList = data.versions.filter((item) => {
      if (_.get(item, 'cluster[0].status') === 'offline') return item;
    });

    if (_onlineList.length > keepOnlineNum || _offlineList.length > keepOfflineNum) {
      clearList[data.name] = data.versions;
    }
  });

  return clearList;
};

/**
 * 机器状态
 * @param {Array} status
 * @param {String} status.ip
 * @param {Array} status.data
 */
export const getClusterUsages = (status) => {
  if (!status) {
    return [];
  }

  return status.map(stt => {
    const {memoryUsage, memory} = stt.data;
    const disk = _.get(stt, 'data.diskInfo.serverRoot.size', 0);
    const ava = _.get(stt, 'data.diskInfo.serverRoot.available', 0);

    return {
      ip: stt.ip,
      totalMem: Number(memory).toFixed(2),
      avaMem: (((100 - memoryUsage) / 100) * memory).toFixed(2),
      totalDisk: (disk / TRANS).toFixed(2),
      avaDisk: (ava / TRANS).toFixed(2)
    };
  });
};

/**
 * 通过 app_id 获取 app 的各类信息
 * @param {String} app_id abc_1.0.1_1
 * @return {Object} {name: string; version: string; build: string}
 */
export const getAppInfo = (appId) => {
  if (!appId) {
    return {};
  }

  const result = appId.match(APP_ID_MATCH);

  if (!result) {
    return {};
  }
  const [, name, version, build] = result;

  return {
    name, version, build
  };
};

/**
 * 获取当前多个版本中正在运行app_id
 * @param {Array} versions
 */
export const getCurrentWorking = (versions) => {
  return _.find(versions, (v) => v.isCurrWorking);
};

const toFixed2 = (n) => {
  return Number(Number(n).toFixed(2));
};

// 按分钟分组，并取最后20分钟
const groupByMinute = (usage, chunk = 10) => {
  const map = {};
  const data = [];

  usage.forEach(point => {
    const {timestamp, value} = point;

    if (!map[timestamp.format('HH:mm')]) {
      map[timestamp.format('HH:mm')] = [];
    }

    map[timestamp.format('HH:mm')].push(value);
  });

  Object.keys(map).forEach(key => {
    const avg = _.sum(map[key]) / map[key].length;

    data.push({
      timestamp: key,
      value: _.round(avg, 2)
    });
  });

  return data.slice(-chunk, -1);
};

/**
 * 将usage转为kv形式
 * @param {Object} usage
 * @param {String} usage.cpuUsage
 * @param {String} usage.memUsage
 */
export const parseUsgae = (usage) => {
  if (!usage) {
    return {
      memUsage: [],
      cpuUsage: []
    };
  }

  const {memUsage, cpuUsage} = usage;
  const parsedMemUsage = [];
  const parseCpuUsage = [];

  memUsage.split(';').forEach(part => {
    const [timestamp, used] = part.split(',');
    const fixedUse = toFixed2(used);

    parsedMemUsage.push({
      timestamp: moment(timestamp, 'HH:mm:ss'),
      value: fixedUse
    });
  });

  cpuUsage.split(';').forEach(part => {
    const [timestamp, used] = part.split(',');
    const fixedUse = toFixed2(used);

    parseCpuUsage.push({
      timestamp: moment(timestamp, 'HH:mm:ss'),
      value: fixedUse
    });
  });

  return {
    memUsage: groupByMinute(parsedMemUsage),
    cpuUsage: groupByMinute(parseCpuUsage)
  };
};

/**
 * 获取每一个应用的异常情况的统计
 * @param {Array} apps
 */
export const getAppExpceptStatistics = (apps) => {
  let total = 0;
  let errorCount = 0;
  const errorApps = [];

  apps.forEach(({versions}) => {
    versions.forEach(version => {
      total++;
      const status = version.cluster.map(c => c.status);

      if (status.includes('exception')) {
        errorApps.push(version.appId);
        errorCount++;
      }
    });
  });

  return {
    errorCount, total, errorApps
  };
};
