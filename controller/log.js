'use strict';
const fs = require('xfs');
const _ = require('lodash');
const PATH = require('path');
const async = require('async');
const moment = require('moment');
const qs = require('querystring');
const config = require('../config');
const log = require('../common/log');
const utils = require('../common/utils');
const cluster = require('../model/cluster');

const callremote = utils.callremote;

const appUsageCachePath = PATH.join(config.serverRoot, './logs/_app_usage_cache_');

if (!fs.existsSync(appUsageCachePath)) {
  fs.sync().mkdir(appUsageCachePath);
}


/**
 * 获取日志列表
 * @api {get} /api/log
 * @nowrap
 * @param req
 * @param res
 */
exports.queryLog = function (req, res) {
  const clusterCode = req.query.clusterCode;

  const logFileName = processFileName(req.query);

  if (!logFileName) {
    return res.send({
      code: 'ERROR',
      message: '参数错误'
    });
  }

  const opt = cluster.getClusterCfgByCode(clusterCode);

  if (opt.code === 'ERROR') {
    res.statusCode = 500;

    return res.json(opt);
  }
  const path = '/api/log';

  function processFileName(data) {
    const tmp = data.fileName || '';
    const m = moment(data.logDate);

    return tmp.replace(/\{(\w+)\}/g, function (m0, m1) {
      let v;

      switch (m1) {
        case 'year':
          v = m.format('YYYY');
          break;
        case 'month':
          v = m.format('MM');
          break;
        case 'day':
          v = m.format('DD');
          break;
        default:
          v = m0;
      }

      return v;
    });
  }
  if (req.query.ips) {
    opt.ips = req.query.ips.split(',');
  }
  opt.data = {
    fileName: processFileName(req.query),
    logLines: req.query.logLines,
    filterString: req.query.filterString,
    startTime: req.query.startTime
  };

  callremote(path, opt, function (err, results) {
    res.json(results);
  });
};

/**
 * @api {get} /api/log/list
 * @nowrap
 * @param req
 * @param res
 */
exports.listLogs = function (req, res) {
  const clusterCode = req.query.clusterCode;

  const opt = cluster.getClusterCfgByCode(clusterCode);

  if (opt.code === 'ERROR') {
    return res.json(opt);
  }
  // 取一台机器
  opt.ips = [opt.ips[0]];
  if (opt.code === 'ERROR') {
    res.statusCode = 500;

    return res.json(opt);
  }
  const path = '/api/logs';

  callremote(path, opt, function (err, results) {
    if (err) {
      log.error(err);

      return res.json({code: err.code || 'ERROR', message: err.message});
    }
    const data = results.data.success[0] && results.data.success[0].data || [];
    const tmp = [];

    data.forEach(function (v) {
      for (let i = 0; i < config.ignoreLogFiles.length; i++) {
        if (config.ignoreLogFiles[i].test(v)) {
          return;
        }
      }
      tmp.push(v);
    });

    if (!req.user.isClusterAdmin()) {
      results.data = _.filter(tmp, function (logFileName) {
        if (logFileName.indexOf('/') === -1) {
          return true;
        }

        const logAppFile = logFileName.match(/^([^/.]+).+/);

        if (!logAppFile) return false;
        const appName = logAppFile[1];

        if (req.user.containsApp(clusterCode, appName)) {
          return true;
        }

        return false;
      });
    } else {
      results.data = tmp;
    }

    res.json(results);
  });
};

/**
 * @api {get} /api/appUsages
 * @param req
 * @param callback
 */
exports.queryAppUsages = function (req, callback) {
  const from = req.query.from;
  const to = req.query.to;
  let ips = req.query.ips || '';
  const clusterCode = req.query.clusterCode;

  if (!from || !to || !clusterCode) {
    log.error('params: ', 'from:', from, 'to:', to, 'clusterCode:', clusterCode);

    return callback(new Error('Missing params.'));
  }
  if (ips) {
    ips = ips.split(',');
  }

  const start = from.split('-'); // [2016, 12, 12, 20]
  const end = to.split('-'); // [2016, 12, 12, 21]
  // eslint-disable-next-line
  const ms = moment([end[0], end[1] - 1, end[2], end[3]]) - moment([start[0], start[1] - 1, start[2], start[3]]);
  const hours = ms / 3600000; // 1000 * 60 * 60;
  const fileNames = [`app-usage.${start[0]}-${start[1]}-${start[2]}-${start[3]}.log`];

  for (let i = 1; i < hours; i++) {
    // eslint-disable-next-line
    const file = moment([start[0], start[1] - 1, start[2], start[3]]).add(i, 'hour').format('YYYY-MM-DD-HH');

    fileNames.push(`app-usage.${file}.log`);
  }
  log.debug('fileNames: ', fileNames);
  let allResults = {};

  async.eachSeries(fileNames, function (fileName, done) {
    getUsageFromServer(fileName, function (err, data) {
      allResults = mergeResult(allResults, data || {});
      done();
    });
  }, function (err) {
    callback(err, allResults);
  });

  function mergeResult(r1, r2) {
    const ips = Object.keys(r2);

    // eslint-disable-next-line
    ips.some(function (ip) {
      if (!r1[ip]) {
        r1[ip] = _.cloneDeep(r2[ip]);
      } else {
        const appUsages = r2[ip];
        const apps = Object.keys(appUsages);

        // eslint-disable-next-line
        apps.some(function (app) {
          if (!r1[ip][app]) {
            r1[ip][app] = _.cloneDeep(appUsages[app]);
          } else {
            r1[ip][app].cpuUsage = _.concat(r1[ip][app].cpuUsage || [], appUsages[app].cpuUsage);
            r1[ip][app].memUsage = _.concat(r1[ip][app].memUsage || [], appUsages[app].memUsage);
          }
        });
      }
    });

    return r1;
  }

  function getUsageFromServer(fileName, cb) {
    const opt = cluster.getClusterCfgByCode(clusterCode);

    if (opt.code === 'ERROR') {
      return cb(opt);
    }
    if (ips) {
      opt.ips = ips;
    }
    opt.data = {
      fileName: fileName
    };
    const path = '/api/appUsages';

    callremote(path, opt, function (err, usages) {
      if (err) {
        return cb(err);
      }
      if (usages.code !== 'SUCCESS') {
        return cb(usages);
      }
      const data = usages.data.success;
      const result = {};

      data.forEach(function (item) {
        const ip = item.ip;
        const lines = item.usage.split('\n');
        const tmp = {};

        lines.forEach(function (line) {
          // 20171227-03:59:28
          const t = line.substr(9, 8);

          line = line.substr(18);
          line = line.replace(/\s/g, '');
          const appUsage = qs.parse(line, ';', ':');
          const appIds = Object.keys(appUsage);

          appIds.forEach(function (appId) {
            if (!appUsage[appId]) {
              return;
            }

            if (typeof appUsage[appId] !== 'string') {
              return;
            }

            const appUsages = appUsage[appId].split('^');
            let cpu = 0;
            let mem = 0;

            appUsages.forEach(function (usage) {
              const usages = usage.split(',');

              cpu += Number(usages[1]);
              mem += Number(usages[2]);
            });
            if (!tmp[appId]) {
              tmp[appId] = {
                cpuUsage: [],
                memUsage: []
              };
            } else {
              tmp[appId].cpuUsage.push(t + ',' + cpu);
              tmp[appId].memUsage.push(t + ',' + mem);
            }
          });
        });

        Object.keys(tmp).forEach((key) => {
          tmp[key].cpuUsage = tmp[key].cpuUsage.join(';');
          tmp[key].memUsage = tmp[key].memUsage.join(';');
        });
        result[ip] = tmp;
      });
      cb(null, result);
    });
  }
};


/**
 * @api {get} /api/download-log-file
 * @desc 代理下载文件
 * @nowrap
 * @param req
 * @param res
 * query
 *   file {String} fileName
 *   clusterCode {String} clusterCode
 *   ips {String} ip list
 */
exports.downloadLogFileBatch = function (req, res) {
  const file = req.query.file;
  const clusterCode = req.query.clusterCode;

  if (!file) {
    return res.json({
      code: 'ERROR',
      message: 'param missing, params.file is empty'
    });
  }

  const opt = cluster.getClusterCfgByCode(clusterCode);

  if (opt.code === 'ERROR') {
    res.statusCode = 500;

    return res.json(opt);
  }
  let ips = req.query.ips;

  ips = ips && ips.split(',');

  opt.data = {
    file
  };

  const uri = '/api/download-log-file';

  callremote(uri, {
    ...opt,
    method: 'GET',
    ips: ips,
    streaming: true
  }, function (err, data, r) {
    if (err) {
      return res.json({
        code: 'ERROR',
        message: err
      });
    } else {
      if (r.headers['content-type'] !== 'application/octet-stream') {
        res.setHeader('Content-type', r.headers['content-type']);
      } else {
        const disposition = r.headers['content-disposition'];

        res.setHeader('Content-type', 'application/octet-stream');
        res.setHeader('Content-Disposition', disposition);
      }
      r.pipe(res);
    }
  });
};
