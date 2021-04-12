const log = require('../common/log');
const db = require('../common/db');

const AppConfig = {};

const INSERT_APP_CFG = `INSERT INTO
  hc_console_system_cluster_apps_config (cluster_code, type, app, config, version, user, gmt_create)
  VALUES(?, ?, ?, ?, ?, ?, ?)`;

AppConfig.save = (appCfg, callback) => {
  const d = new Date();

  db.query(
    INSERT_APP_CFG,
    [
      appCfg.clusterCode,
      appCfg.type, appCfg.app,
      JSON.stringify(appCfg.config),
      d.getTime(),
      appCfg.user, d
    ],
    function (err) {
      if (err) {
        log.error('Insert new user failed:', err);
      } else {
        log.info('Add user success');
      }
      callback(err);
      AppConfig.cleanAppConfig(appCfg.clusterCode, appCfg.type, appCfg.app);
    }
  );
};

/**
 * 获取app的当前最新配置
 */
const GET_APP_CFG = `
  SELECT 
    cluster_code, app, config, version, user, gmt_create
  FROM hc_console_system_cluster_apps_config
  WHERE cluster_code = ? and type = ? and app = ? 
  ORDER BY id desc 
  LIMIT 1
`;

AppConfig.getAppConfig = (clusterCode, type, app, callback) => {
  db.query(
    GET_APP_CFG,
    [clusterCode, type, app],
    function (err, data) {
      if (err) {
        log.error('get app config failed:', err);

        return callback(err);
      } else {
        log.info('get app config success');
        if (data[0]) {
          data[0].config = JSON.parse(data[0].config);
        }
        callback(null, data[0]);
      }
    }
  );
};

/**
 * 获取app的历史配置版本
 */
const GET_APP_CFG_HIS = `
  SELECT 
    cluster_code, app, config, version, user, gmt_create
  FROM hc_console_system_cluster_apps_config
  WHERE cluster_code = ? and app = ? order by version desc limit 100
`;

AppConfig.getAppConfigAllHistory = (appCfg, callback) => {
  db.query(
    GET_APP_CFG_HIS,
    [appCfg.clusterCode, appCfg.app],
    function (err, data) {
      if (err) {
        log.error('get app config failed:', err);

        return callback(err);
      } else {
        log.info('get app config success');
        data.forEach((d) => {
          d.config = JSON.parse(d.config);
        });
        callback(null, data);
      }
    }
  );
};

/**
 * 获取集群下所有的app配置
 */
const GET_CLUSTER_APP_CFGS = `
  SELECT 
    cluster_code, app, config, max(version)
  FROM hc_console_system_cluster_apps_config
  WHERE cluster_code = ? 
  GROUP by cluster_code, app, config
`;

AppConfig.getClusterAppConfigs = (appCfg, callback) => {
  db.query(
    GET_CLUSTER_APP_CFGS,
    [appCfg.clusterCode],
    function (err, data) {
      if (err) {
        log.error('get app config failed:', err);

        return callback(err);
      } else {
        log.info('get app config success');
        data.forEach((d) => {
          d.config = JSON.parse(d.config);
        });
        callback(null, data);
      }
    }
  );
};

const DELETE_APPS_CONFIG = `
  delete from hc_console_system_cluster_apps_config
  where cluster_code = ? and type = ? and app = ? and id < (
    select min(id) as id from (
      select id from hc_console_system_cluster_apps_config 
      where
        cluster_code = ? and type = ? and app = ?
      order by id desc limit 3
    ) topids
  )
`;

AppConfig.cleanAppConfig = (clusterCode, type, app, callback) => {
  db.query(DELETE_APPS_CONFIG, [clusterCode, type, app, clusterCode, type, app], (err) => {
    if (err) {
      log.error('clean app config failed', err.message);
    }
    callback && callback(err);
  });
};

module.exports = AppConfig;
