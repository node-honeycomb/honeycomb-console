/* eslint-disable  max-len */
const fs = require('fs');
const path = require('path');
const os = require('os');
const uuid = require('uuid').v4;
const log = require('../common/log');
const db = require('../common/db');
const config = require('../config');

let storage = false;

exports.init = function (cb) {
  if (config.storage) {
    try {
      config.storage.log = log;
      storage = require('../common/storage/' + config.storage.driver)(config.storage);
    } catch (e) {
      log.error('get storage driver error', e);
      storage = undefined;
    }
  }
  cb();
};

/**
 * 获取包的上传临时地址
 */
exports.getPackageTmpUrl = (pkg) => {
  if (storage && storage.genTmpPutUrl) {
    return storage.genTmpPutUrl(pkg);
  } else {
    return null;
  }
};

/**
 * 下载临时包
 */
exports.getTmpPackage = (pkg, tmpFile, cb) => {
  if (storage) {
    storage.get(pkg, tmpFile, cb);
  } else {
    cb(new Error('unsupport tmp package publish'));
  }
};
/**
 * 删除临时包
 */
exports.deleteTmpPackage = (pkg, cb) => {
  if (storage) {
    storage.delete(pkg, cb);
  } else {
    cb(null);
  }
};

/**
 * 保存pkg到数据库
 */
const INSERT_APP_PKG = db.genSqlWithParamPlaceholder(`INSERT INTO
    hc_console_system_cluster_app_pkgs (cluster_code, app_id, app_name, weight, package, ${db.quoteIdentifier('user')}, gmt_create)
  VALUES(?, ?, ?, ?, ?, ?, ?)`);

exports.savePackage = (data, callback) => {
  const d = new Date();

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
        const err = new Error('storage save failed, return empty fileKey');

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
const DELETE_APP_PKG = db.genSqlWithParamPlaceholder(`delete from hc_console_system_cluster_app_pkgs where cluster_code = ? and app_id = ?`);

exports.deletePackage = (clusterCode, appId, callback) => {
  db.query(
    GET_APP_PKG,
    [clusterCode, appId],
    function (err, data) {
      if (err) {
        log.error(`[${clusterCode} ${appId}] delete app pkg: query pkg info failed:`, err);

        return callback(err);
      } else {
        log.info(`[${clusterCode} ${appId}] delete app pkg: query pkg info successfully`, JSON.stringify(data[0]));
        if (data[0]) {
          if (storage && storage.delete && data[0].package) {
            storage.delete(data[0].package.toString(), (err) => {
              if (err) {
                log.error(`[${clusterCode} ${appId}] delete package from storage failed:`, err);
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
const GET_APP_PKG = db.genSqlWithParamPlaceholder(`
  SELECT 
    cluster_code as clusterCode, 
    app_id as appId, 
    app_name as appName, 
    weight, 
    package
  FROM hc_console_system_cluster_app_pkgs
  WHERE cluster_code = ? and app_id = ?
`);

exports.getPackage = (clusterCode, appId, callback) => {
  db.query(
    GET_APP_PKG,
    [clusterCode, appId],
    function (err, data) {
      if (err) {
        log.error(`[${clusterCode} ${appId}] get app pkg:  failed when query pkg info:`, err);

        return callback(err);
      } else {
        log.info(`[${clusterCode} ${appId}] get app pkg: query pkg info success`, JSON.stringify(data[0]));
        if (data[0] && data[0].package) {
          // 并发时，需要确保文件名唯一，确保每个请求有独立文件
          const tmpFile = path.join(os.tmpdir(), data[0].clusterCode + '^' + data[0].appId + '.' + uuid() + '.tgz');

          if (storage) {
            storage.get(data[0].package.toString(), tmpFile, (err) => {
              if (err) {
                log.error(`[${clusterCode} ${appId}] get app package failed:`, err);

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
