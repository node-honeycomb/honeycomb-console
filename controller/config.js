'use strict';
const utils = require('../common/utils');
const cluster = require('../model/cluster');
const jsonParser = require('editor-json-parser');
const callremote = utils.callremote;


/**
 * @api {get} /api/config/:appId/get
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
  let appId = req.params.appId;
  let type = req.query.type;
  let path = `/api/config/${type}/${appId}`;
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
 * @api {post} /api/config/:appId/update
 * @nowrap
 * @param req
 * @param res
 */
exports.setAppConfig = function (req, res) {
  let appId = req.params.appId;
  let type = req.body.type;
  req.oplog({
    clientId: req.ips.join('') || '-',
    opName: 'SET_APP_CONFIG',
    opType: 'PAGE_MODEL',
    opLogLevel: 'NORMAL',
    opItem: 'APP_CONFIG',
    opItemId: appId
  });
  let clusterCode = req.body.clusterCode;
  let opt = cluster.getClusterCfgByCode(clusterCode);
  if (opt.code === 'ERROR') {
    return res.json(opt);
  }
  let path = `/api/config/${type}/${appId}`;
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
