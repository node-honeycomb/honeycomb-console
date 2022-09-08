'use strict';
const oplog = require('../model/oplog');

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

  if (!startTime || !endTime || !clusterCode) {
    return res.send({
      code: 'ERROR',
      message: '参数错误'
    });
  }

  const dateStartTime = new Date(startTime);
  const dateEndTime = new Date(endTime);

  oplog.getOpLog(clusterCode, dateStartTime.getTime(), dateEndTime.getTime(),
    function (err, data) {
      res.json({code: 'SUCCESS', data});
    });
};

/**
 * 记录日志列表
 * @api {get} /api/oplog/log
 * @nowrap
 * @query
 *   opName {string} PUBLISH_APP PACK_APP
 *   file {string} app tgz file name
 *   clusterCode {string} cluster code
 */
exports.logOpLog = function (req, res) {
  const file = req.query.file;
  const clusterCode = req.query.clusterCode;
  const opName = req.query.opName;

  let opLogLevel = 'NORMAL';

  res.setHeader('content-type', 'image/png');

  switch (opName) {
    case 'PACK_APP':
      opLogLevel = 'NORMAL';
      break;
    case 'PUBLISH_APP':
      opLogLevel = 'RISKY';
      break;
    case 'DOWNLOAD_APP':
      opLogLevel = 'RISKY';
      break;
    default:
      return res.send('unknow opName');
  }

  if (!file || !clusterCode || !opName) {
    return res.send('missing param, file and clusterCode');
  }
  req.oplog({
    clientId: req.ips.join('') || '-',
    opName: opName,
    opType: 'PAGE_MODEL',
    opLogLevel: opLogLevel, // HIGH_RISK / RISKY / LIMIT / NORMAL
    opItem: 'APP',
    opItemId: file
  });
  res.send('');
};
