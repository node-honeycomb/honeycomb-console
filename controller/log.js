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
 * @api {get} /api/log
 * @nowrap
 * @param req
 * @param res
 */
exports.queryLog = function (req, res) {
  let clusterCode = req.query.clusterCode;

  if (!req.session.user.role && !req.session.user.clusterAcl[clusterCode]) {
    return res.send({
      code: 'ERROR',
      message: 'Cluster unauthorizied'
    });
  }

  let logFileName = processFileName(req.query);
  if (!logFileName) {
    return res.send({
      code: 'ERROR',
      message: '参数错误'
    });
  }

  // if (!req.session.user.role && !req.session.user.clusterAcl[clusterCode].isAdmin) {
  //   if (_.startsWith(logFileName, 'server.') || _.startsWith(logFileName, 'node_stdout.') || _.startsWith(logFileName, 'nodejs_stdout.')) {
  //     //do not check app authority
  //   } else {
  //     let logAppFile = logFileName.match(/^([^/.]+).+/);
  //     if (!logAppFile) {
  //       return res.send({
  //         code: 'ERROR',
  //         message: '参数错误'
  //       });
  //     }
  //     let logAppName = logAppFile[1];

  //     let apps = req.session.user.clusterAcl[clusterCode].apps;

  //     if (apps.indexOf('*') === -1 && apps.indexOf(logAppName) === -1) {
  //       return res.send({
  //         code: 'ERROR',
  //         message: 'App unauthorizied'
  //       });
  //     }
  //   }
  // }

  let opt = cluster.getClusterCfgByCode(clusterCode);
  if (opt.code === 'ERROR') {
    res.statusCode = 500;
    return res.json(opt);
  }
  let path = '/api/log';

  function processFileName(data) {
    let tmp = data.fileName || '';
    let m = moment(data.logDate);
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
  let clusterCode = req.query.clusterCode;

  // if (!req.session.user.role && !req.session.user.clusterAcl[clusterCode]) {
  //   return res.send({
  //     code: 'ERROR',
  //     message: 'Cluster unauthorizied'
  //   });
  // }

  let opt = cluster.getClusterCfgByCode(clusterCode);
  // 取一台机器
  opt.ips = [opt.ips[0]];
  if (opt.code === 'ERROR') {
    res.statusCode = 500;
    return res.json(opt);
  }
  let path = '/api/logs';

  callremote(path, opt, function (err, results) {
    if (err) {
      log.error(err);
      return res.json({code: err.code || 'ERROR', message: err.message});
    }
    let data = results.data.success[0] && results.data.success[0].data || [];
    let tmp = [];
    data.forEach(function (v) {
      for (let i = 0; i < config.ignoreLogFiles.length; i++) {
        if (config.ignoreLogFiles[i].test(v)) {
          return;
        }
      }
      tmp.push(v);
    });

    if (false && !req.session.user.role && !req.session.user.clusterAcl[clusterCode].isAdmin) {
      results.data = _.filter(tmp, function (logFileName) {
        if (_.startsWith(logFileName, 'server.') || _.startsWith(logFileName, 'node_stdout.') || _.startsWith(logFileName, 'nodejs_stdout.')) {
          return true;
        }

        let logAppFile = logFileName.match(/^([^/.]+).+/);
        if (!logAppFile) return false;
        let logAppName = logAppFile[1];
        let apps = req.session.user.clusterAcl[clusterCode].apps;

        if (apps.indexOf('*') > -1 || apps.indexOf(logAppName) > -1) {
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
  let from = req.query.from;
  let to = req.query.to;
  let ips = req.query.ips || '';
  let clusterCode = req.query.clusterCode;
  if (!from || !to || !clusterCode) {
    log.error('params: ', 'from:', from, 'to:', to, 'clusterCode:', clusterCode);
    return callback(new Error('Missing params.'));
  }
  if (ips) {
    ips = ips.split(',');
  }

  let start = from.split('-'); // [2016, 12, 12, 20]
  let end = to.split('-'); // [2016, 12, 12, 21]
  let ms = moment([end[0], end[1] - 1, end[2], end[3]]) - moment([start[0], start[1] - 1, start[2], start[3]]);
  let hours = ms / 3600000; // 1000 * 60 * 60;
  let fileNames = [`app-usage.${start[0]}-${start[1]}-${start[2]}-${start[3]}.log`];
  for (let i = 1; i < hours; i++) {
    let file = moment([start[0], start[1] - 1, start[2], start[3]]).add(i, 'hour').format('YYYY-MM-DD-HH');
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
    let ips = Object.keys(r2);
    ips.some(function (ip) {
      if (!r1[ip]) {
        r1[ip] = _.cloneDeep(r2[ip]);
      } else {
        let appUsages = r2[ip];
        let apps = Object.keys(appUsages);
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
    let opt = cluster.getClusterCfgByCode(clusterCode);
    if (opt.code === 'ERROR') {
      return cb(opt);
    }
    if (ips) {
      opt.ips = ips;
    }
    opt.data = {
      fileName: fileName
    };
    let path = '/api/appUsages';
    callremote(path, opt, function (err, usages) {
      if (err) {
        return cb(err);
      }
      let data = usages.data.success;
      let result = {};
      data.forEach(function (item) {
        let ip = item.ip;
        let lines = item.usage.split('\n');
        let tmp = {};
        lines.forEach(function (line) {
          // 20171227-03:59:28
          let t = line.substr(9, 8);
          line = line.substr(18);
          line = line.replace(/\s/g, '');
          let appUsage = qs.parse(line, ';', ':');
          let appIds = Object.keys(appUsage);
          appIds.forEach(function (appId) {
            let appUsages = appUsage[appId].split('^');
            let cpu = 0;
            let mem = 0;
            appUsages.forEach(function (usage) {
              let usages = usage.split(',');
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
