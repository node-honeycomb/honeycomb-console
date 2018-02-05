'use strict';
const utils = require('../common/utils');
const cluster = require('../model/cluster');
const jsonParser = require('editor-json-parser');
const callremote = utils.callremote;


/**
 * @api {get} /api/config/:appName
 * @nowrap
 * @param req
 * @param res
 */
exports.getAppConfig = function (req, res) {
  let clusterCode = req.query.clusterCode;
  let opt = cluster.getClusterCfgByCode(clusterCode);
  if (opt.code === 'ERROR') {
    return res.json(opt);
  }
  let appName = req.params.appName;
  let type = req.params.type;
  let path = `/api/config/${type}/${appName}`;
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
 * @api {post} /api/config/:appName
 * @nowrap
 * @param req
 * @param res
 */
exports.setAppConfig = function (req, res) {
  let appName = req.params.appName;
  let type = req.params.type;
  req.oplog({
    clientId: req.ips.join('') || '-',
    opName: 'SET_APP_CONFIG',
    opType: 'PAGE_MODEL',
    opLogLevel: 'NORMAL',
    opItem: 'APP_CONFIG',
    opItemId: appName
  });
  let clusterCode = req.body.clusterCode;
  let opt = cluster.getClusterCfgByCode(clusterCode);
  if (opt.code === 'ERROR') {
    return res.json(opt);
  }
  let path = `/api/config/${type}/${appName}`;
  opt.method = 'POST';
  try {
    opt.data = jsonParser.parse(req.body.appConfig);
  } catch (e) {
    return res.json({
      code: 'INVALID_JSON',
      message: e.message
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
