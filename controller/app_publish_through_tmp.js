const os = require('os');
const tmpDir = os.tmpdir();
const async = require('async');
const uuid = require('uuid').v4;
const path = require('path');
const formstream = require('formstream');
const appPkg = require('../model/app_package');
const cluster = require('../model/cluster');
const utils = require('../common/utils');
const log = require('../common/log');

const callremote = utils.callremote;

const BASE_PATH = 'honeycomb_apps_tmp/';

/**
 * 获取一个临时上传package的地址
 * @api {GET} /api/app/getUploadTmpUrl
 * @query
 *  fileName {String} 集群code
 * @nowrap
 */
exports.getAppUploadTmpUrl = function (req, res) {
  // 包的文件名
  const fileName = req.query.fileName;
  const key = path.join(BASE_PATH, fileName);
  const uploadUrl = appPkg.getPackageTmpUrl(key);

  if (uploadUrl) {
    res.json({
      code: 'SUCCESS',
      data: {
        url: uploadUrl.replace(/-internal\.aliyuncs\.com/, '.aliyuncs.com').replace(/^http:/, 'https:'),
        pkgKey: key
      }
    });
  } else {
    res.json({
      code: 'ERROR',
      message: 'get tmp upload url failed'
    });
  }
};
/**
 * 发布一个app到当前集群
 * @api {post} /api/app/publishThroughTmp
 * @query
 *  clusterCode {String} 集群code
 * @body
 *  file {File} tmp package path on oss, with .tmp ext, like: /abc/sdf/abc_1.0.0.tgz.tmp
 * @nowrap
 */
exports.publishAppThroughTmp = function (req, res) {
  const clusterCode = req.body.clusterCode;
  const timeout = req.query.timeout;
  // file 为临时存储的oss key, 必须为.tmp后缀的文件
  const fileName = req.body.file;

  if (!clusterCode || !fileName) {
    return res.json({
      code: 'ERROR',
      message: 'body missing: clusterCode and fileName required'
    });
  }
  const tmpFile = path.join(tmpDir, uuid());

  appPkg.getTmpPackage(fileName, tmpFile, (err) => {
    if (err) {
      log.error('publish app through tmp error', err);

      return res.json({
        code: 'ERROR',
        message: 'download tmp package failed:' + err.message
      });
    }
    log.info('get tmp package successfully', fileName, tmpFile);
    async.waterfall([
      function savePackage(cb) {
        const appId = path.basename(fileName).replace(/\.tgz$/, '');
        // const appId = file.originalname.replace(/\.tgz$/, '');
        const appInfo = utils.parseAppId(appId);

        const obj = {
          clusterCode,
          appId: appInfo.id,
          appName: appInfo.name,
          weight: appInfo.weight,
          pkg: tmpFile,
          user: req.session.username
        };
        const file = {
          originalname: path.basename(fileName),
          path: tmpFile,
        };

        appPkg.savePackage(obj, (err) => {
          cb(err, file);
        });
      },
      function (file, cb) {
        const opt = cluster.getClusterCfgByCode(clusterCode);

        if (opt.code === 'ERROR') {
          return cb(opt);
        }
        log.info(`publish "${file.originalname}" to server: ${opt.endpoint}`);
        const form = formstream();

        form.file('pkg', file.path, file.originalname);
        const path = '/api/publish';

        opt.method = 'POST';
        opt.headers = form.headers();
        opt.stream = form;
        opt.timeout = timeout || 1000000;
        callremote(path, opt, cb);
      },
    ], function (err, results) {
      if (err || results.code !== 'SUCCESS') {
        const errMsg = err && err.message || results.message;

        log.error('publish app failed:', errMsg);
        log.error(err);
        const code = (err && err.code) || (results && results.code) || 'ERROR';

        return res.json({
          code: code,
          message: errMsg
        });
      } else {
        cluster.saveSnapShot2(clusterCode, (err) => {
          if (err) {
            return res.json({
              code: err.code,
              message: err.message
            });
          } else {
            return res.json({
              code: 'SUCCESS',
              data: results.data
            });
          }
        });
      }
      // clean tmp package
      appPkg.deleteTmpPackage(fileName, () => {
        log.info('clean tmp package', err ? 'failed, ' + err : ' successfully');
      });
    });
  });
};
