'use strict';

const log = require('../common/log');
const db = require('../common/db');

const QUERY_SYSTEM_USER_ACL = db.genSqlWithParamPlaceholder(`
  SELECT
    *
  FROM
    hc_console_system_user_acl
  WHERE
   name = ?`);

const QUERY_ALL_CLUSTER = db.genSqlWithParamPlaceholder(`SELECT *
  FROM hc_console_system_cluster
  WHERE
    status = 1`);

exports.getUserAcl = function (user, callback) {
  if (user.role === 1) {
    db.query(
      QUERY_ALL_CLUSTER,
      function (err, data) {
        if (err) {
          log.error('Qeury cluster failed:', err);

          return callback(err);
        } else if (!data || data.length === 0) {
          callback(null, []);
        } else {
          const clusterList = [];

          data.forEach((rowData) => {
            clusterList.push({
              id: rowData.id,
              // eslint-disable-next-line
              cluster_code: rowData.code,
              // eslint-disable-next-line
              cluster_name: rowData.name,
              // eslint-disable-next-line
              cluster_admin: 1
            });
          });
          callback(null, clusterList);
        }
      }
    );
  } else {
    db.query(
      QUERY_SYSTEM_USER_ACL,
      [user.name],
      function (err, data) {
        if (err) {
          log.error('Qeury user_acl failed:', user.name, err);

          return callback(err);
        } else {
          callback(null, data);
        }
      }
    );
  }
};

const QUERY_CLUSTER_ACL = db.genSqlWithParamPlaceholder(`
  SELECT
    *
  FROM
    hc_console_system_user_acl
  WHERE
    cluster_code in (?)`);

exports.getClusterAcl = function (user, callback) {
  var clusterCodeList = [];

  clusterCodeList = Object.keys(user.clusterAcl);
  var adminClusterList = user.getAdminClusterList();

  if (adminClusterList.length === 0) {
    callback(null);

    return;
  }
  db.query(
    QUERY_CLUSTER_ACL,
    [adminClusterList],
    function (err, data) {
      if (err) {
        log.error('Qeury user_acl failed:', clusterCodeList, err);

        return callback(err);
      } else {
        var clusterAclList = [];
        var clusterAclMap = {};

        adminClusterList.forEach((clusterCode) => {
          const clusterAcl = {
            cluster: clusterCode,
            acls: []
          };

          clusterAclMap[clusterCode] = clusterAcl;
          clusterAclList.push(clusterAcl);
        });

        data.forEach((item) => {
          clusterAclMap[item.cluster_code].acls.push(item);
        });

        callback(null, data);
      }
    }
  );
};

const INSERT_USER_ACL = db.genSqlWithParamPlaceholder(`INSERT INTO
  hc_console_system_user_acl
  (name, cluster_id, cluster_code, cluster_name, cluster_admin, apps, gmt_create, gmt_modified)
  VALUES(?, ?, ?, ?, ?, ?, ?, ?)
`);

exports.addUserAcl = function (
  name, clusterId, clusterCode,
  clusterName, clusterAdmin,
  apps, callback
) {
  if (!apps) apps = '["*"]';
  try {
    JSON.parse(apps);
  } catch (err) {
    return callback({
      code: 'ERROR',
      message: 'apps 参数异常'
    });
  }
  const dd = new Date();

  db.query(
    INSERT_USER_ACL,
    [name, clusterId, clusterCode, clusterName, clusterAdmin, apps, dd, dd],
    function (err) {
      if (err) {
        log.error('Insert new user acl failed:', err);

        return callback(err);
      } else {
        log.info('Add user acl success');
        callback();
      }
    }
  );
};

const UPDATE_USER_ACL = db.genSqlWithParamPlaceholder(`UPDATE hc_console_system_user_acl
  SET name = ? , cluster_admin = ? , apps = ?
  WHERE id = ?`);

exports.updateClusterAcl = function (userAcl, callback) {
  if (!userAcl.apps) userAcl.apps = '["*"]';
  try {
    JSON.parse(userAcl.apps);
  } catch (err) {
    return callback({
      code: 'ERROR',
      message: 'apps 参数异常'
    });
  }
  db.query(UPDATE_USER_ACL,
    [userAcl.name, userAcl.cluster_admin, userAcl.apps, userAcl.id],
    function (err) {
      if (err) {
        log.error('Update user acl failed:', err);

        return callback(err);
      } else {
        log.info('Update user acl success');
        callback();
      }
    });
};

const DELETE_USER_ACL = db.genSqlWithParamPlaceholder(`DELETE FROM hc_console_system_user_acl
  WHERE name = ? and cluster_id = ? and cluster_code = ?`);

exports.deleteClusterAcl = function (userAcl, callback) {
  db.query(DELETE_USER_ACL,
    [userAcl.name, userAcl.cluster_id, userAcl.cluster_code],
    function (err) {
      if (err) {
        log.error('Delete user acl failed:', err);

        return callback(err);
      } else {
        log.info('Delete user acl success');
        callback();
      }
    });
};

const DELETE_USER_ALL_ACL = db.genSqlWithParamPlaceholder(`DELETE FROM hc_console_system_user_acl
  WHERE cluster_code = ?`);

exports.deleteClusterAllAcl = function (clusterCode, callback) {
  db.query(DELETE_USER_ALL_ACL,
    [clusterCode],
    function (err) {
      if (err) {
        log.error('Delete user acl failed:', err);

        return callback(err);
      } else {
        log.info('Delete user acl success');
        callback();
      }
    });
};
