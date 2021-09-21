const log = require('../common/log');
const db = require('../common/db');
const config = require('../config');
const fs = require('fs');
const path = require('path');
const os = require('os');


let storage = false;

if (config.storage) {
  try {
    config.storage.log = log;
    storage = require('../common/storage/' + config.storage.driver)(config.storage);
  } catch (e) {
    log.error('get storage driver error', e);
    storage = undefined;
  }
}
/**
 * 保存pkg到数据库
 */
const INSERT_APP_PKG = `REPLACE INTO
    hc_console_system_cluster_app_pkgs (cluster_code, app_id, app_name, weight, package, user, gmt_create)
  VALUES(?, ?, ?, ?, ?, ?, ?)`;
exports.savePackage = (data, callback) => {
  let d = new Date();
  if (db.type === 'sqlite' && !config.debug) {
    return callback(null);
  }
  if (storage) {
    storage.save(data.clusterCode + '/' + data.appId + '.tgz', data.pkg, (err, fkey) => {
      if (err) {
        err.message = `storage save failed, app: ${data.appId}, path: ${data.pkg}` + err.message;
        log.error(err.message);
        return callback(err);
      }
      if (!fkey) {
        let err = new Error('storage save failed, return empty fileKey');
        return callback(err);
      }
      save('key', fkey, callback);
    });
  } else if (storage === false) {
    save('key', '', callback);
  } else {
    save('file', data.pkg, callback);
  }

  function save(type, file, callback) {
    db.query(
      INSERT_APP_PKG,
      [data.clusterCode, data.appId, data.appName, data.appWeight, type === 'key' ? file : fs.readFileSync(file), data.user, d],
      function (err) {
        if (err) {
          log.error('Insert pkg failed:', err);
          return callback(err);
        } else {
          log.info('insert pkg success', file);
          callback(null);
        }
      }
    );
  }
};

/**
 * 删除包
 */
const DELETE_APP_PKG = `delete from hc_console_system_cluster_app_pkgs where cluster_code = ? and app_id = ?`;
exports.deletePackage = (clusterCode, appId, callback) => {
  db.query(
    GET_APP_PKG,
    [clusterCode, appId],
    function (err, data) {
      if (err) {
        log.error('delete app pkg: query pkg info failed:', err);
        return callback(err);
      } else {
        log.info('delete app pkg: query pkg info successfully', JSON.stringify(data[0]));
        if (data[0]) {
          if (storage && storage.delete && data[0].package) {
            storage.delete(data[0].package.toString(), (err) => {
              if (err) {
                log.error(`delete package from storage failed, cluster: ${clusterCode} appId: ${appId}`, err);
              }
              db.query(DELETE_APP_PKG, [clusterCode, appId], callback);
            });
          } else {
            db.query(DELETE_APP_PKG, [clusterCode, appId], callback);
          }
        }
      }
    }
  );
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
        log.error('get app pkg:  failed when query pkg info:', err);
        return callback(err);
      } else {
        log.info('get app pkg: query pkg info success', JSON.stringify(data[0]));
        if (data[0] && data[0].package) {
          let tmpFile = path.join(os.tmpdir(), data[0].clusterCode + '^' + data[0].appId + '.tgz');
          if (storage) {
            storage.get(data[0].package.toString(), tmpFile, (err) => {
              if (err) {
                log.error(`get app package failed, cluster: ${clusterCode} appId: ${appId}`, err);
                return callback(err);
              }
              data[0].package = tmpFile;
              callback(null, data[0]);
            });
          } else if (storage === false) {
            callback(null, '');
          } else {
            fs.writeFileSync(tmpFile, data[0].package);
            data[0].package = tmpFile;
            callback(null, data[0]);
          }
        } else {
          callback(null);
        }
      }
    }
  );
};