const log = require('../common/log');
const db = require('../common/db');
const config = require('../config');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * 保存pkg到数据库
 */
const INSERT_APP_PKG = `INSERT INTO
    hc_console_system_cluster_app_pkgs (cluster_code, app_id, app_name, weight, package, user, gmt_create)
  VALUES(?, ?, ?, ?, ?, ?, ?)`;
exports.savePackage = (data, callback) => {
  let d = new Date();
  if (db.type === 'sqlite' && !config.debug) {
    return callback(null);
  }
  db.query(
    INSERT_APP_PKG,
    [data.clusterCode, data.appId, data.appName, data.appWeight, fs.readFileSync(data.pkg), data.user, d],
    function (err) {
      if (err) {
        log.error('Insert pkg failed:', err);
        return callback(err);
      } else {
        log.info('insert pkg success');
        callback(null);
      }
    }
  );
};

/**
 * 删除包
 */
const DELETE_APP_PKG = `delete from hc_console_system_cluster_app_pkgs where cluster_code = ? and app_id = ?`;
exports.deletePackage = (clusterCode, appId, callback) => {
  db.query(DELETE_APP_PKG, [clusterCode, appId], callback);
};

/**
 * 根据集群和appName获取最新pkg到临时文件
 */
const GET_APP_PKG = `
  SELECT 
    cluster_code as clusterCode, 
    app_id as appId, 
    app_name as appName, 
    weight, 
    package
  FROM hc_console_system_cluster_app_pkgs
  WHERE cluster_code = ? and app_id = ?
`;
exports.getPackage = (clusterCode, appId, callback) => {
  let d = new Date();
  db.query(
    GET_APP_PKG,
    [clusterCode, appId],
    function (err, data) {
      if (err) {
        log.error('get app pkg failed:', err);
        return callback(err);
      } else {
        log.info('get app pkg success');
        if (data[0]) {
          let tmpFile = path.join(os.tmpdir(), data[0].clusterCode + '^' + data[0].appId + '.tgz');
          fs.writeFileSync(tmpFile, data[0].package);
          data[0].package = tmpFile;
        }
        callback(null, data[0]);
      }
    }
  );
};