const db = require('../common/db');

const OpLog = {};

OpLog.add = (msg, callback) => {
  const keys = Object.keys(msg);
  const values = Object.values(msg).map(v => typeof v === 'object' ?
    JSON.stringify(v) : v);
  const INSERT_OPLOG = `INSERT INTO
  hc_console_system_oplog (${keys.join(',')})
  VALUES(${values.map(() => '?').join(',')})`;

  db.query(
    INSERT_OPLOG,
    values,
    function (err) {
      callback && callback(err);
    }
  );
};

/**
 * 获取一定时间范围的操作日志
 */
const GET_OPLOG = `
  SELECT 
    *
  FROM hc_console_system_oplog
  WHERE clusterCode = ? and time >= ? and time <= ? 
  ORDER BY time desc
`;

OpLog.getOpLog = (clusterCode, startTime, endTime, callback) => {
  db.query(
    GET_OPLOG,
    [clusterCode, startTime, endTime],
    function (err, data) {
      if (err) {
        return callback(err);
      } else {
        callback(null, data.map(log => {
          log.detail && (log.detail = JSON.parse(log.detail));
          log.extends && (log.extends = JSON.parse(log.extends));
          log.socket && (log.socket = JSON.parse(log.socket));

          return log;
        }));
      }
    }
  );
};

module.exports = OpLog;
