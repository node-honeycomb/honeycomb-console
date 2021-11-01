'use strict';
const jsonParser = require('editor-json-parser');
const utils = require('../common/utils');
const cluster = require('../model/cluster');
const appConfig = require('../model/app_config');
const callremote = utils.callremote;


/**
 * 查询某一个app/集群的配置
 * @api {get} /api/config/:appName/get
 * @nowrap
 * @query
 *  type {String} 查询类型 app（应用配置查询） | server（集群配置查询, common 和 server 时使用）
 *  clusterCode {String} 集群code
 * @param
 *  appName {String} 应用名
 */
exports.getAppConfig = function (req, res) {
  const clusterCode = req.query.clusterCode;
  const opt = cluster.getClusterCfgByCode(clusterCode);

  if (opt.code === 'ERROR') {
    return res.json(opt);
  }
  const appName = req.params.appName;
  const type = req.query.type;
  const path = `/api/config/${type}/${appName}`;

  callremote(path, opt, function (err, results) {
    if (err) {
      res.json({
        code: 'GET_APPS_CONFIG_FAILED',
        message: err.message
      });
    } else {
      res.json(results);
    }
  });
};

/**
 * @api {get} /api/config/:type/:appName/persistent
 * @nowrap
 * @param req
 * @param res
 */
exports.getAppConfigPersistent = function (req, res) {
  const clusterCode = req.query.clusterCode;
  const opt = cluster.getClusterCfgByCode(clusterCode);

  if (opt.code === 'ERROR') {
    return res.json(opt);
  }
  const app = req.params.appName;
  const type = req.params.type;

  appConfig.getAppConfig(clusterCode, type, app, (err, data) => {
    if (err) {
      return res.json({
        code: 'ERROR',
        message: 'get app\'s persistent config failed' + err.message
      });
    }
    res.json({
      code: 'SUCCESS',
      data
    });
  });
};

/**
 * @api {get} /api/config/:appName/history
 * @nowrap
 * @param req
 * @param res
 */
exports.getAppConfigHistory = function (req, res) {
  const clusterCode = req.query.clusterCode;
  const opt = cluster.getClusterCfgByCode(clusterCode);

  if (opt.code === 'ERROR') {
    return res.json(opt);
  }
  const app = req.params.appName;

  appConfig.getAppConfigAllHistory({clusterCode, app}, (err, data) => {
    if (err) {
      return res.json({
        code: 'ERROR',
        message: 'get app\'s persistent config failed' + err.message
      });
    }
    res.json({
      code: 'SUCCESS',
      data: data
    });
  });
};


/**
 * 更新某一个app的配置
 * @api {post} /api/config/:appName/update
 * @nowrap
 * @query
 *  type {String} 更新类型 app | server
 * @body
 *  clusterCode {String} 集群code
 *  saveConfig {String} 是否保存Config 'false' = 不保存 其他值 保存
 */
exports.setAppConfig = function (req, res) {
  const appName = req.params.appName;
  const type = req.body.type;
  const clusterCode = req.body.clusterCode;
  const saveConfig = req.body.saveConfig;
  const opt = cluster.getClusterCfgByCode(clusterCode);

  if (opt.code === 'ERROR') {
    return res.json(opt);
  }
  const path = `/api/config/${type}/${appName}`;

  opt.method = 'POST';
  try {
    opt.data = jsonParser.parse(req.body.appConfig);
  } catch (e) {
    return res.json({
      code: 'INVALID_JSON',
      message: e.message
    });
  }

  appConfig.getAppConfig(clusterCode, type, appName, function (err, data) {
    const [oldConfig, newConfig] = utils.configRemoveSecretFields(data ?
      data.config : {}, opt.data);

    req.oplog({
      clientId: req.ips.join('') || '-',
      opName: 'SET_APP_CONFIG',
      opType: 'PAGE_MODEL',
      opLogLevel: 'NORMAL',
      opItem: 'APP_CONFIG',
      opItemId: appName,
      extends: {
        oldConfig,
        newConfig
      }
    }, false);
  });

  const cfgObj = {
    type,
    clusterCode,
    app: appName,
    config: opt.data,
    user: req.session.username
  };

  const setConfig = (err) => {
    if (err) {
      return res.json({
        code: 'ERROR',
        message: 'presist app config failed, check honeycomb-console\'s metadb',
      });
    }
    callremote(path, opt, function (err) {
      if (err) {
        res.json({
          code: 'SET_APPS_CONFIG_FAILED',
          message: err.message
        });
      } else {
        res.json({code: 'SUCCESS'});
      }
    });
  };

  if (saveConfig === 'false') {
    setConfig();
  } else {
    appConfig.save(cfgObj, setConfig);
  }
};
