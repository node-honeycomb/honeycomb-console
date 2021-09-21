'use strict';
const async = require('async');
const formstream = require('formstream');
const formidable = require('formidable');
const log = require('../common/log');
const utils = require('../common/utils');
const cluster = require('../model/cluster');
const appPackage = require('../model/app_package');

const callremote = utils.callremote;

function saveSnapShot(clusterCode) {
  let opt = cluster.getClusterCfgByCode(clusterCode);
  if (opt.code === 'ERROR') {
    log.warn();
    return;
  }
  utils.getClusterApps(opt, (err, data) => {
    if (err) {
      log.error('snapshot faild, get cluster info failed', err);
    } else {
      let obj = {
        clusterCode,
        info: data
      };
      cluster.saveSnapshot(obj, (err) => {
        if (err) {
          log.error('save snapshot failed', err);
        }
      });
    }
  });
}

/**
 * @api {get} /api/app/list
 * @param req
 * @param callback
 */
exports.listApp = function (req, callback) {
  let clusterCode = req.query.clusterCode;
  let opt = cluster.getClusterCfgByCode(clusterCode);
  if (opt.code === 'ERROR') {
    return callback(opt);
  }

  let path = '/api/apps';
  callremote(path, opt, function (err, result) {
    if (err || result.code !== 'SUCCESS') {
      let errMsg = err && err.message || result.message;
      log.error('get apps from servers failed: ', errMsg);
      let code = (err && err.code) || (result && result.code) || 'ERROR';
      return callback({
        code: code,
        message: errMsg
      });
    } else {
      let ips = [];
      let apps = [];
      result.data.success.forEach((item) => {
        ips.push(item.ip);
        apps = apps.concat(item.apps);
      });

      apps = apps.filter((app) => {
        return req.user.containsApp(clusterCode, app.name);
      });

      return callback(null, {
        success: utils.mergeAppInfo(ips, apps),
        error: result.data.error
      });
    }
  });
};

/**
 * @api {post} /api/app/publish
 * @param req
 * @param callback
 */
exports.publishApp = function (req, callback) {
  let clusterCode = req.query.clusterCode;
  let recover = req.query.recover === 'true';
  async.waterfall([
    function receivePkg(cb) {
      let form = new formidable.IncomingForm();
      form.maxFileSize = 1000 * 1024 * 1024;
      form.parse(req, function (err, fields, files) {
        req.oplog({
          clientId: req.ips.join('') || '-',
          opName: 'PUBLISH_APP',
          opType: 'PAGE_MODEL',
          opLogLevel: 'NORMAL',
          opItem: 'APP',
          opItemId: files && files.pkg && files.pkg.name || 'UNKNOW_FILE_NAME'
        });
        if (err) {
          err.code = 'ERROR_UPLOAD_APP_PACKAGE_FAILED';
          return cb(err);
        }
        if (!files || !Object.keys(files).length) {
          let err = new Error('app package empty');
          err.code = 'ERROR_APP_PACKAGE_EMPTY';
          return cb(err);
        }
        cb(null, files.pkg);
      });
    },
    function savePackage(file, cb) {
      let appId = file.name.replace(/.tgz$/, '');
      let appInfo = utils.parseAppId(appId);
      let obj = {
        clusterCode,
        appId: appInfo.id,
        appName: appInfo.name,
        weight: appInfo.weight,
        pkg: file.path,
        user: req.session.username
      };
      if (!recover) {
        appPackage.savePackage(obj, (err) => {
          cb(err, file);
        });
      } else {
        cb(null, file);
      }
    },
    function (file, cb) {
      let opt = cluster.getClusterCfgByCode(clusterCode);
      if (opt.code === 'ERROR') {
        return cb(opt);
      }
      log.info(`publish "${file.name}" to server: ${opt.endpoint}`);
      let form = formstream();
      form.file('pkg', file.path, file.name);
      let path = '/api/publish';
      opt.method = 'POST';
      opt.headers = form.headers();
      opt.stream = form;
      opt.timeout = 1000000;
      callremote(path, opt, cb);
    }
  ], function (err, results) {
    if (err || results.code !== 'SUCCESS') {
      let errMsg = err && err.message || results.message;
      log.error('publish app failed:', errMsg);
      let code = (err && err.code) || (results && results.code) || 'ERROR';
      return callback({
        code: code,
        message: errMsg
      });
    } else {
      if (!recover) {
        saveSnapShot(clusterCode);
      }
      return callback(null, results.data);
    }
  });
};

/**
 * @api {POST} /api/app/:appId/clean_exit_record
 * @param req
 * @param callback
 */
exports.cleanAppExitRecord = function (req, callback) {
  let appId = req.params && req.params.appId;
  req.oplog({
    clientId: req.ips.join('') || '-',
    opName: 'CLEAN_APP_EXIT_RECORD',
    opType: 'PAGE_MODEL',
    opLogLevel: 'NORMAL',
    opItem: 'APP',
    opItemId: appId
  });
  let clusterCode = req.body.clusterCode;
  let opt = cluster.getClusterCfgByCode(clusterCode);
  if (opt.code === 'ERROR') {
    return callback(opt);
  }
  if (['__PROXY___0.0.0_0', '__ADMIN___0.0.0_0'].indexOf(appId) >= 0) {
    appId = appId.substring(0, appId.length - 8);
  }
  let path = `/api/clean_exit_record/${appId}`;
  opt.method = 'DELETE';
  callremote(path, opt, function (err, results) {
    if (err || results.code !== 'SUCCESS') {
      let errMsg = err && err.message || results.message;
      log.error(`clean appExitRecord of ${appId} failed: `, errMsg);
      let code = (err && err.code) || (results && results.code) || 'ERROR';
      return callback({
        code: code,
        message: errMsg
      });
    } else {
      log.debug('clean appExitRecord results:', results);
      return callback(null, results.data);
    }
  });
};

/**
 * @api {post} /api/app/:appId/delete
 * @param req
 * @param callback
 */
exports.deleteApp = function (req, callback) {
  let appId = req.params && req.params.appId;
  req.oplog({
    clientId: req.ips.join('') || '-',
    opName: 'DELETE_APP',
    opType: 'PAGE_MODEL',
    opLogLevel: 'RISKY', // HIGH_RISK / RISKY / LIMIT / NORMAL http://twiki.corp.taobao.com/bin/view/SRE/Taobao_Security/DataSecPolicy
    opItem: 'APP',
    opItemId: appId
  });
  let clusterCode = req.body.clusterCode;
  let opt = cluster.getClusterCfgByCode(clusterCode);
  if (opt.code === 'ERROR') {
    return callback(opt);
  }
  let path = `/api/delete/${appId}`;
  opt.method = 'POST';
  callremote(path, opt, function (err, results) {
    if (err || results.code !== 'SUCCESS') {
      let errMsg = err && err.message || results.message;
      log.error(`delete app ${appId} failed: `, errMsg);
      let code = (err && err.code) || (results && results.code) || 'ERROR';
      return callback({
        code: code,
        message: errMsg
      });
    } else {
      log.debug(`delete app ${appId} results:`, results);
      appPackage.deletePackage(clusterCode, appId, (err) => {
        if (err) {
          log.error('delete apppackage failed', err.message);
        }
      });
      saveSnapShot(clusterCode);
      return callback(null, results.data);
    }
  });
};

/**
 * @api {post} /api/app/:appId/restart
 */
exports.restartApp = function (req, callback) {
  let appId = req.params && req.params.appId;
  req.oplog({
    clientId: req.ips.join('') || '-',
    opName: 'RESTART_APP',
    opType: 'PAGE_MODEL',
    opLogLevel: 'LIMIT',
    opItem: 'APP',
    opItemId: appId
  });
  let clusterCode = req.body.clusterCode;
  let opt = cluster.getClusterCfgByCode(clusterCode);
  if (opt.code === 'ERROR') {
    return callback(opt);
  }
  let path = `/api/restart/${appId}`;
  opt.method = 'POST';
  opt.timeout = 30000;
  callremote(path, opt, function (err, results) {
    if (err || results.code !== 'SUCCESS') {
      let errMsg = err && err.message || results.message;
      log.error(`restart app ${appId} failed: `, errMsg);
      let code = (err && err.code) || (results && results.code) || 'ERROR';
      return callback({
        code: code,
        message: errMsg
      });
    } else {
      log.debug(`restart app ${appId} results:`, results);
      return callback(null, results.data);
    }
  });
};

/**
 * @api {post} /api/app/:appId/reload
 * @param req
 * @param callback
 */
exports.reloadApp = function (req, callback) {
  let appId = req.params && req.params.appId;
  req.oplog({
    clientId: req.ips.join('') || '-',
    opName: 'RELOAD_APP',
    opType: 'PAGE_MODEL',
    opLogLevel: 'LIMIT',
    opItem: 'APP',
    opItemId: appId
  });
  let clusterCode = req.body.clusterCode;
  let opt = cluster.getClusterCfgByCode(clusterCode);
  if (opt.code === 'ERROR') {
    return callback(opt);
  }
  let path = `/api/reload/${appId}`;
  opt.method = 'POST';
  opt.timeout = 60000;
  callremote(path, opt, function (err, results) {
    if (err || results.code !== 'SUCCESS') {
      let errMsg = err && err.message || results.message;
      log.error(`reload app ${appId} failed: `, errMsg);
      let code = (err && err.code) || (results && results.code) || 'ERROR';
      return callback({
        code: code,
        message: errMsg
      });
    } else {
      log.debug(`reload app ${appId} results:`, results);
      return callback(null, results.data);
    }
  });
};

/**
 * @api {post} /api/app/:appId/start
 * @param req
 * @param callback
 */
exports.startApp = function (req, callback) {
  let appId = req.params && req.params.appId;
  req.oplog({
    clientId: req.ips.join('') || '-',
    opName: 'START_APP',
    opType: 'PAGE_MODEL',
    opLogLevel: 'LIMIT',
    opItem: 'APP',
    opItemId: appId
  });
  let clusterCode = req.body.clusterCode;
  let opt = cluster.getClusterCfgByCode(clusterCode);
  if (opt.code === 'ERROR') {
    return callback(opt);
  }
  let path = `/api/start/${appId}`;
  opt.method = 'POST';
  callremote(path, opt, function (err, results) {
    if (err || results.code !== 'SUCCESS') {
      let errMsg = err && err.message || results.message;
      log.error(`start app ${appId} failed: `, errMsg);
      let code = (err && err.code) || (results && results.code) || 'ERROR';
      return callback({
        code: code,
        message: errMsg
      });
    } else {
      log.debug(`start app ${appId} results:`, results);
      saveSnapShot(clusterCode);
      return callback(null, results.data);
    }
  });
};

/**
 * @api {post} /api/app/:appId/stop
 * @param req
 * @param callback
 */
exports.stopApp = function (req, callback) {
  let appId = req.params && req.params.appId;
  req.oplog({
    clientId: req.ips.join('') || '-',
    opName: 'STOP_APP',
    opType: 'PAGE_MODEL',
    opLogLevel: 'RISKY',
    opItem: 'APP',
    opItemId: appId
  });
  let clusterCode = req.body.clusterCode;
  let opt = cluster.getClusterCfgByCode(clusterCode);
  if (opt.code === 'ERROR') {
    return callback(opt);
  }
  let path = `/api/stop/${appId}`;
  opt.method = 'POST';
  opt.timeout = 30000;
  callremote(path, opt, function (err, results) {
    if (err || results.code !== 'SUCCESS') {
      let errMsg = err && err.message || results.message;
      log.error(`stop app ${appId} failed: `, errMsg);
      let code = (err && err.code) || (results && results.code) || 'ERROR';
      return callback({
        code: code,
        message: errMsg
      });
    } else {
      log.debug(`stop app ${appId} results:`, results);
      saveSnapShot(clusterCode);
      return callback(null, results.data);
    }
  });
};