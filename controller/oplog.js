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
 * @api {get} /api/oplog/publish
 * @nowrap
 * @query
 *   file {string} app tgz file name
 *   clusterCode {string} cluster code
 */
exports.logPublishOpLog = function (req, res) {
  const file = req.query.file;
  const clusterCode = req.query.clusterCode;

  if (!file || !clusterCode) {
    return res.json({
      code: 'ERROR',
      message: 'missing param, file and clusterCode'
    });
  }
  req.oplog({
    clientId: req.ips.join('') || '-',
    opName: 'PUBLISH_APP',
    opType: 'PAGE_MODEL',
    opLogLevel: 'NORMAL',
    opItem: 'APP',
    opItemId: file
  });

  res.json({code: 'SUCCESS', data: null});
};
