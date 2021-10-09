'use strict';
const fs = require('xfs');
const path = require('path');

function fixZero(num) {
  return num > 9 ? num : '0' + num;
}

function calculateFileName(format, time) {
  const date = new Date(time);
  const year = date.getFullYear();
  const month = fixZero(date.getMonth() + 1);
  const day = fixZero(date.getDate());
  const hour = fixZero(date.getHours());
  const minute = fixZero(date.getMinutes());

  return format
    .replace(/%year%/g, year)
    .replace(/%month%/g, month)
    .replace(/%day%/g, day)
    .replace(/%hour%/g, hour)
    .replace(/%minute%/g, minute)
    .replace(/%pid%/g, process.pid);
}

/**
 * 获取操作日志列表
 * @api {get} /api/oplog
 * @nowrap
 * @param req
 * @param res
 */
exports.queryOpLog = function (req, res) {
  const startTime = req.query.startTime;
  const endTime = req.query.endTime;
  const clusterCode = req.query.clusterCode;

  if (!startTime || !endTime) {
    return res.send({
      code: 'ERROR',
      message: '参数错误'
    });
  }
  const logFile = req.oplog.logFile;

  const startFileName = calculateFileName(logFile, startTime);
  const endFileName = calculateFileName(logFile, endTime);

  const sep = path.sep;
  const tmp = logFile.split(sep);
  let flag = 0;

  tmp.forEach((v, i) => {
    if (/%\w+%/.test(v)) {
      flag = i;
    }
  });
  const base = tmp.slice(0, flag).join(sep);
  const pattern = new RegExp(logFile.substr(base.length)
    .replace(/%year%/g, '\\d{4}')
    .replace(/%month%/g, '\\d{2}')
    .replace(/%day%/g, '\\d{2}')
    .replace(/%hour%/g, '\\d{2}')
    .replace(/%minute%/g, '\\d{2}')
    .replace(/%pid%/g, process.pid));
  const logs = [];

  fs.walk(base, pattern, (err, f, done) => {
    if (startFileName <= f && f <= endFileName) {
      const logContent = fs.sync().readFileSync(f, {encoding: 'utf8'});

      // TODO 大文件流式读取
      logs.push(logContent
        .slice(0, logContent.length - 1)
        .split('\n')
        .filter(r => r !== '')
        .map(r => JSON.parse(r))
        .filter(r => r.clusterCode === clusterCode)
      );
    }
    done();
  }, () => res.json({code: 'SUCCESS', data: logs.flat().reverse()}));
};
