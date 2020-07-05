import _ from 'lodash';
import moment from 'moment';
import {APP_ID_MATCH} from '@lib/consts';

const TRANS = 1024 * 1024 * 1024;

/**
 * 机器状态
 * @param {Array} status
 * @param {String} status.ip
 * @param {Array} status.data
 */
export const getClusterUsages = (status) => {
  return status.map(stt => {
    const {memoryUsage, memory} = stt.data;
    const disk = _.get(stt, 'data.diskInfo.serverRoot.size');
    const ava = _.get(stt, 'data.diskInfo.serverRoot.available');

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
      value: avg
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

    parsedMemUsage.push({
      timestamp: moment(timestamp, 'HH:mm:ss'),
      value: toFixed2(used)
    });
  });

  cpuUsage.split(';').forEach(part => {
    const [timestamp, used] = part.split(',');

    parseCpuUsage.push({
      timestamp: moment(timestamp, 'HH:mm:ss'),
      value: toFixed2(used)
    });
  });

  return {
    memUsage: groupByMinute(parsedMemUsage),
    cpuUsage: groupByMinute(parseCpuUsage)
  };
};
