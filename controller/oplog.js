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
