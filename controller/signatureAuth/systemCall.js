const log = require('../../common/log');
const utils = require('../../common/utils');
const cluster = require('../../model/cluster');
const callremote = utils.callremote;

/**
 * @api {get} /signatureAuth/systemCall/appList
 */
exports.appList = async function (req, callback) {
  const clusterCode = req.query.clusterCode;

  await new Promise(r => {
    cluster.getClusterCfg(() => {
      r();
    });
  });
  const opt = cluster.getClusterCfgByCode(clusterCode);

  if (opt.code === 'ERROR') {
    return callback(opt);
  }
  const path = '/api/apps';

  callremote(path, opt, function (err, result) {
    if (err || result.code !== 'SUCCESS') {
      const errMsg = (err && err.message) || result.message;

      log.error('get apps from servers failed: ', errMsg);
      const code = (err && err.code) || (result && result.code) || 'ERROR';

      return callback({
        code: code,
        message: errMsg
      });
    } else {
      const ips = [];
      let apps = [];

      result.data.success.forEach(item => {
        ips.push(item.ip);
        apps = apps.concat(item.apps);
      });

      return callback(null, {
        success: utils.mergeAppInfo(ips, apps),
        error: result.data.error
      });
    }
  });
};
