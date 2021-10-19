/* eslint-disable max-lines */
const async = require('async');
const _ = require('lodash');
const net = require('net');
const log = require('../common/log');
const db = require('../common/db');
const userAcl = require('./user_acl');
const config = require('../config');
const utils = require('../common/utils');
const callremote = utils.callremote;

const INSERT_SYSTEM_CLUSTER = `
  INSERT INTO hc_console_system_cluster
    (name, code, token, endpoint, env, monitor, gmt_create, gmt_modified)
  VALUES
    (?, ?, ?, ?, ?, ?, ?, ?) ;`;

exports.addCluster = function (
  name, code, token, endpoint,
  env, monitor,
  callback
) {
  const d = new Date();

  db.query(
    INSERT_SYSTEM_CLUSTER,
    [name, code, token, endpoint, env, monitor, d, d],
    function (err) {
      if (err) {
        // log.error('Insert new cluster failed:', err);
        return callback(err);
      } else {
        // log.info('Add cluster success');
        callback();
      }
    }
  );
};

const UPDATE_SYSTEM_CLUSTER = `
  UPDATE hc_console_system_cluster
  SET status = 1, name = ?, token = ?, endpoint = ?, env = ?, monitor = ?, gmt_modified = ?
  WHERE code = ?;
`;

exports.updateCluster = function (
  name, code, token, endpoint,
  env, monitor,
  callback
) {
  const d = new Date();

  db.query(
    UPDATE_SYSTEM_CLUSTER,
    [name, token, endpoint, env, monitor, d, code],
    function (err) {
      if (err) {
        log.error('Update cluster failed:', err);

        return callback(err);
      } else {
        log.info('update cluster success');
        callback();
      }
    }
  );
};

const UPDATE_SYSTEM_CLUSTER_ENDPOINT = `
  UPDATE hc_console_system_cluster
    SET endpoint = ?, gmt_modified = ?
  WHERE code = ?;
`;

exports.updateClusterEndpoint = function (code, endpoint, callback) {
  callback = callback || function () {};
  const d = new Date();

  db.query(UPDATE_SYSTEM_CLUSTER_ENDPOINT, [endpoint, d, code], function (err) {
    if (err) {
      log.error('Update cluster failed:', err);

      return callback(err);
    } else {
      log.info('update cluster success');
      callback();
    }
  });
};

const DELETE_SYSTEM_CLUSTER = `
  DELETE FROM
    hc_console_system_cluster
  WHERE code = ?;`;

exports.deleteCluster = function (code, callback) {
  db.query(DELETE_SYSTEM_CLUSTER, [code], function (err) {
    if (err) {
      log.error('Delete cluster failed:', err);

      return callback(err);
    } else {
      log.info('Delete cluster success');
      callback();
    }
  });
};

const INSERT_SYSTEM_WORKER = `
  INSERT INTO hc_console_system_worker
    (ip, cluster_code, gmt_create, gmt_modified)
  VALUES
    (?, ?, ?, ?);`;

exports.addWorker = function (ipAddress, clusterCode, callback) {
  const d = new Date();

  db.query(INSERT_SYSTEM_WORKER, [ipAddress, clusterCode, d, d], function (
    err
  ) {
    if (err && err.code !== 'ER_DUP_ENTRY') {
      log.error('Insert new worker failed:', err);

      return callback(err);
    } else {
      log.info('Add worker success');
      callback(null);
    }
  });
};

const INSERT_SYSTEM_WORKER_TMP = `
  INSERT INTO hc_console_system_worker_tmp
    (ip, cluster_code, gmt_create)
  VALUES
    (?, ?, ?);`;
const CHECK_SYSTEM_WORKER_TMP = `
  select count(*) as cc from hc_console_system_worker_tmp where ip=? and cluster_code=?
`;

exports.addTmpWorker = function (ipAddress, clusterCode, callback) {
  const d = new Date();

  db.query(CHECK_SYSTEM_WORKER_TMP, [ipAddress, clusterCode], (err, data) => {
    if (err) {
      return callback(err);
    }
    if (data && data[0].cc > 0) {
      return callback(null);
    }
    db.query(INSERT_SYSTEM_WORKER_TMP, [ipAddress, clusterCode, d], function (
      err
    ) {
      if (err) {
        log.error('Insert new worker failed:', err);

        return callback(err);
      } else {
        log.info('Add worker success');
        callback(null);
      }
    });
  });
};

const DELETE_SYSTEM_WORKER = `
  DELETE FROM
    hc_console_system_worker
  WHERE
    ip = ? and cluster_code = ?;
`;

exports.deleteWorker = function (ipAddress, clusterCode, callback) {
  db.query(DELETE_SYSTEM_WORKER, [ipAddress, clusterCode], callback);
};

const UPDATE_SYSTEM_WORKER_BY_CLUSTER = `
  update hc_console_system_worker set status = ? where ip in (?) and cluster_code = ?
`;

exports.updateWorker = function (status, ipAddress, clusterCode, callback) {
  if (!Array.isArray(ipAddress)) {
    ipAddress = [ipAddress];
  }
  if (status === 'offline') {
    status = 0;
  } else {
    status = 1;
  }
  db.query(
    UPDATE_SYSTEM_WORKER_BY_CLUSTER,
    [status, ipAddress, clusterCode],
    callback || function () {}
  );
};

const DELETE_SYSTEM_WORKER_BY_CLUSTER = `
  DELETE FROM
    hc_console_system_worker
  WHERE
    cluster_code = ?;
`;

exports.deleteWorkersByClusterCode = function (clusterCode, callback) {
  callback = callback || function () {};
  db.query(DELETE_SYSTEM_WORKER_BY_CLUSTER, [clusterCode], callback);
};

const DELETE_SYSTEM_WORKER_TMP = `
  DELETE FROM
    hc_console_system_worker
  WHERE
    id = ?;
`;

exports.deleteTmpWorker = function (id, callback) {
  db.query(DELETE_SYSTEM_WORKER_TMP, [id], callback);
};

const DELETE_SYSTEM_WORKERS = `
  DELETE FROM
    hc_console_system_worker
  WHERE
    cluster_code = ?;
`;

exports.deleteWorkers = function (clusterCode, callback) {
  db.query(DELETE_SYSTEM_WORKERS, [clusterCode], callback);
};

const QUERY_SYSTEM_WORKER = `
  SELECT ip
  FROM hc_console_system_worker
  WHERE
    cluster_code = ? AND status = 1`;

exports.queryWorker = function (clusterCode, callback) {
  db.query(QUERY_SYSTEM_WORKER, [clusterCode], callback);
};

const SELECT_SYSTEM_CLUSTER_WOKER = `
  select
    b.name,
    b.code,
    b.token,
    b.endpoint,
    b.id,
    a.status,
    group_concat(a.ip) as ip,
    b.env,
    b.monitor
  from
    hc_console_system_cluster b
  join
    hc_console_system_worker a on b.status = 1 and a.cluster_code = b.code
  group by b.name, b.code, b.token, b.id, a.status`;

function adpater2cluster(data) {
  data = data || [];
  const clusterCfg = {};

  data.forEach(function (c) {
    if (!clusterCfg[c.code]) {
      clusterCfg[c.code] = {
        name: c.name,
        token: c.token,
        endpoint: c.endpoint,
        id: c.id,
        ips: [],
        ipsOffline: [],
        monitor: c.monitor
      };
    }

    if (c.status === 1 && c.ip) {
      clusterCfg[c.code].ips = c.ip.split(',');
    } else if (c.ip) {
      clusterCfg[c.code].ipsOffline = c.ip.split(',');
    }

    clusterCfg[c.code] = {
      name: c.name,
      token: c.token,
      endpoint: c.endpoint,
      id: c.id,
      ips: c.ip.split(','),
      env: c.env,
      monitor: c.monitor
    };
  });

  return clusterCfg;
}

exports.getClusterCfg = function (cb) {
  db.query(SELECT_SYSTEM_CLUSTER_WOKER, function (err, data) {
    if (err || !data) {
      const e = new Error('SELECT_SYSTEM_CLUSTER failed: ' + err.message);

      log.error(err.message);

      return cb(e);
    }

    const clusterCfg = adpater2cluster(data);

    exports.gClusterConfig = clusterCfg;
    cb(null, clusterCfg);
  });
};

const SELECT_MONITED_CLUSTER_WORKER = `
  select
    b.name,
    b.code,
    b.token,
    b.endpoint,
    b.id,
    a.status,
    group_concat(a.ip) as ip,
    b.env,
    b.monitor
  from
    hc_console_system_cluster b
  join
    hc_console_system_worker a on b.status = 1 and a.cluster_code = b.code
  where
    b.monitor is not null
  group by b.name, b.code, b.token, b.id, a.status
`;

/**
 * 获取所有填写了有监控机器人的集群
 */
exports.getMonitedClusterCfg = function (cb) {
  db.query(SELECT_MONITED_CLUSTER_WORKER, function (err, data) {
    if (err || !data) {
      const e = new Error('SELECT_MONITED_CLUSTER_WORKER failed: ' + err.message);

      log.error(err.stack);

      return cb(e);
    }

    const clusterCfg = adpater2cluster(data);

    cb(null, clusterCfg);
  });
};

const GET_CLUSTER_MONITOR_BY_CODE = `
  select
    monitor, name
  from
    hc_console_system_cluster
  where
    code = ?
`;

/**
 * 获取集群监控机器人地址
 */
exports.getClusterMonitorByCode = function (code, cb) {
  db.query(GET_CLUSTER_MONITOR_BY_CODE, code, function (err, data) {
    if (err || !data) {
      const e = new Error('GET_CLUSTER_MONITOR_BY_CODE failed: ' + err.message);

      log.error(err.stack);

      return cb(e);
    }

    cb(null, data);
  });
};

exports.gClusterConfig = {};

exports.getClusterCodes = () => {
  return Object.keys(exports.gClusterConfig);
};
/**
 * 更新集群配置在内存中的缓存
 */
exports.fixClusterConfigCache = (clusterCode, ips, errips) => {
  const cluster = exports.gClusterConfig[clusterCode];

  if (cluster) {
    cluster.ips = ips;
    cluster.ipsOffline = errips;
  }
};

exports.getClusterCfgByCode = function (clusterCode) {
  const opt = exports.gClusterConfig[clusterCode] || {};

  if (!opt.endpoint || !opt.token || !opt.ips) {
    const e = new Error('cluster config missing');

    log.error(e.message, 'clusterCfg: ', opt, 'clusterCode: ', clusterCode);

    return {
      code: 'ERROR',
      message: e.message,
    };
  } else {
    return {
      endpoint: opt.endpoint,
      ips: opt.ips,
      ipsOffline: opt.ipsOffline,
      token: opt.token
    };
  }
};

const QUERY_ALL_SYSTEM_WORKER = `
  SELECT *
  FROM hc_console_system_worker
  WHERE
    status = 1`;

exports.queryAllWorker = function (callback) {
  db.query(QUERY_ALL_SYSTEM_WORKER, [], callback);
};

const DELETE_SYSTEM_WORKER_BY_IP = `
  DELETE FROM
    hc_console_system_worker
  WHERE
    ip in (?)
`;

exports.deleteWorkerByIp = function (ip, callback) {
  if (!Array.isArray(ip)) {
    ip = [ip];
  }
  db.query(
    DELETE_SYSTEM_WORKER_BY_IP,
    [ip],
    callback
  );
};

const SQL_QUERY_CLUSTER_SNAPSHORT = `
  select 
    cluster_code as clusterCode, info, md5, gmt_create as gmtCreate
  from 
    hc_console_system_cluster_snapshort 
  where 
    cluster_code = ?
  order by id desc
  limit 1
`;

exports.getSnapshort = (clusterCode, cb) => {
  db.query(SQL_QUERY_CLUSTER_SNAPSHORT, [clusterCode], (err, data) => {
    if (err) {
      return cb(err);
    }
    if (!data || !data.length) {
      return cb(null);
    }
    data[0].info = JSON.parse(data[0].info);
    cb(null, data[0]);
  });
};

const SQL_CLEAN_CLUSTER_SNAPSHORTS = `
  delete from hc_console_system_cluster_snapshort where cluster_code = ? and id < (
    select min(id) from (
      select id from hc_console_system_cluster_snapshort
      order by id desc
      limit 3
    ) topids
  )
`;

exports.cleanSnapshort = (clusterCode, cb) => {
  db.query(SQL_CLEAN_CLUSTER_SNAPSHORTS, [clusterCode], (err) => {
    if (err) {
      log.error('clean snapshort failed', err.message);
    }
    cb && cb(err);
  });
};

const SQL_INSERT_CLUSTER_SNAPSHORT = `insert into hc_console_system_cluster_snapshort 
(cluster_code, info, md5, user, gmt_create) 
values 
(?, ?, ?, ?, ?)`;

exports.saveSnapshort = (obj, cb) => {
  const info = JSON.stringify(obj.info);
  const md5 = utils.md5(info);
  const param = [
    obj.clusterCode,
    info,
    md5,
    obj.user || '',
    new Date()
  ];

  db.query(SQL_INSERT_CLUSTER_SNAPSHORT, param, (err) => {
    cb(err);
    exports.cleanSnapshort(obj.clusterCode);
  });
};

/**
 * 修复集群worker, 通过检测联通性，淘汰漂移的节点
 */
exports.fixCluster = function (clusterCode, callback) {
  const clusterInfo = exports.getClusterCfgByCode(clusterCode);
  const opt = _.cloneDeep(clusterInfo);

  if (opt.code === 'ERROR') {
    return callback(opt);
  }
  const path = '/api/status';

  opt.ips = opt.ips.concat(opt.ipsOffline || []);

  callremote(path, opt, function (err, results) {
    if (err || results.code !== 'SUCCESS') {
      const errMsg = err && err.message || results.message;

      log.error('get status info failed: ', errMsg);
      const code = err && err.code || (results && results.code) || 'ERROR';

      return callback({
        code: code,
        message: errMsg
      });
    } else {
      // log.debug('get status results:', results);
      const errList = results.data.error;
      const okList = results.data.success;
      const okips = [];

      okList.forEach((node) => {
        okips.push(node.ip);
      });
      const errips = [];

      errList.forEach((node) => {
        errips.push(node.ip);
      });
      exports.fixClusterConfigCache(clusterCode, okips, errips);
      if (errips.length) {
        exports.updateWorker('offline', errips, clusterCode);
      }
      if (okips.length) {
        exports.updateWorker('online', okips, clusterCode);
      }
      log.info(`fix cluster ${clusterCode}, okip: ${okips}, errip: ${errips}`);
      callback(null);
    }
  });
};

// TODO: 暂时放这里，后面所有初始化动作放一个文件夹中，前提是需要先改写sql初始化机制保证顺序执行
function clusterInit(callback) {
  // TODO count before addCluster
  // TODO verify clusterCfg format
  // TODO callback once
  callback = callback || function () {};
  const clusterToken = config.clusterToken || '***honeycomb-default-token***';
  const clusterCfg = config.cluster;

  if (!clusterCfg) {
    return callback();
  }
  // 如果没有初始化账户，则不初始化cluster
  if (!config.defaultUser || !config.defaultPassword) {
    return callback();
  }
  _.forEach(clusterCfg, (ips, clusterCode) => {
    if (!ips) return;
    ips = ips
      .split(',')
      .map(ip => ip.trim())
      .filter((eachIp) => {
        return net.isIP(eachIp);
      });
    if (!ips.length) {
      return; // do nothing
    }
    const endpoint = `http://${ips[0]}:9999`;

    exports.addCluster(
      clusterCode,
      clusterCode,
      clusterToken,
      endpoint,
      (err) => {
        // TODO need transcation, cause by error and recovery.
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            // 如果worker改变，需要更新
            exports.queryWorker(clusterCode, (err, workers) => {
              if (err) return callback(err);
              workers = workers.map(w => w.ip);
              if (!_.isEqual(workers.sort(), ips.sort())) {
                // 先删除该cluster原来的所有worker，然后重新初始化
                exports.deleteWorkersByClusterCode(clusterCode, (err) => {
                  if (err) return callback(err);
                  // 同时更新 cluster endpoint
                  exports.updateClusterEndpoint(clusterCode, endpoint);
                  initWorkers(clusterCode, ips);
                });
              }
            });
          } else {
            return callback(err);
          }
        } else {
          initWorkers(clusterCode, ips);
        }
      }
    );
  });
}

function initWorkers(clusterCode, ips, callback) {
  callback = callback || function () {};
  async.eachSeries(
    ips,
    (ip, cb) => {
      exports.addWorker(ip, clusterCode, cb);
    },
    (err) => {
      if (err) {
        return callback(err);
      }
      exports.getClusterCfg(function (err) {
        if (err)
          callback(new Error('getClusterCfg fail before add cluster acl'));
        const newCluster = exports.gClusterConfig[clusterCode];

        if (!newCluster)
          callback(new Error('get new cluster fail after getClusterCfg'));
        userAcl.addUserAcl(
          config.defaultUser,
          newCluster.id,
          clusterCode,
          clusterCode,
          1,
          '["*"]',
          function (err) {
            return callback(err);
          }
        );
      });
    }
  );
}

clusterInit((err) => {
  if (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') {
      // TODO: sql顺序需要可控
      return setTimeout(clusterInit, 1000);
    }
    if (err.code === 'ER_DUP_ENTRY') {
      return;
    }
    log.error(err);
  }
});
