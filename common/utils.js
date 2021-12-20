/* eslint-disable max-len */
const fs = require('fs');
const _ = require('lodash');
const url = require('url');
const urllib = require('urllib');
const crypto = require('crypto');
const qs = require('querystring');
const childProcess = require('child_process');

const log = require('./log');

exports.urlencode = function (str) {
  try {
    return encodeURIComponent(str);
  } catch (e) {
    log.error(e.stack);

    return str;
  }
};

exports.urldecode = function (str) {
  try {
    return decodeURIComponent(str);
  } catch (e) {
    log.error(e.stack);

    return str;
  }
};

exports.md5 = function (str) {
  if (typeof str !== 'string') {
    throw new Error('md5 only support string');
  }
  const hash = crypto.createHash('md5');

  hash.update(str);

  return hash.digest('hex');
};

exports.sha256 = function (str) {
  if (typeof str !== 'string') {
    throw new Error('sha256 only support string');
  }
  const hash = crypto.createHash('sha256');

  hash.update(str);

  return hash.digest('hex');
};

exports.genPwd = function (pwd, salt) {
  let hash = exports.sha256(pwd);

  if (salt) {
    hash = exports.sha256(salt + hash);
  }

  return hash;
};

exports.checkPwd = function (pwd) {
  if (pwd.length < 16) {
    return new Error('password need 16+ characters');
  }
  if (!/[A-Z]/.test(pwd) || !/[a-z]/.test(pwd) || !/\d/.test(pwd) || /^[a-zA-Z0-9]+$/.test(pwd)) {
    // console.log('>>>>',!/A-Z/.test(pwd), !/a-z/.test(pwd), !/\d/.test(pwd), /^[a-zA-Z0-9]+$/.test(pwd));
    return new Error('password too simple, should contain all this kinds of characters: A-Z, a-z, 0-9, and special character');
  }

  return true;
};

exports.md5base64 = function (buf) {
  return crypto.createHash('md5').update(buf, 'utf8').digest('base64');
};

exports.sha1 = function (str, secret) {
  return crypto.createHmac('sha1', secret).update(str).digest('base64');
};

exports.getUidAndGid = function (changeUser) {
  if (!changeUser) {
    return {};
  }
  const uid = process.getuid();

  if (uid >= 500) {
    return {uid: process.getuid(), gid: process.getgid()};
  }
  const gidFile = '/etc/passwd';
  const str = fs.readFileSync(gidFile, 'utf-8');
  const reg = /[^app]admin:x:+(\d+):(\d+)/;
  const res = str.match(reg);

  if (!res) {
    return {};
  }
  const user = {
    uid: +res[1],
    gid: +res[2]
  };

  return user;
};

/**
 * @param {String} command the command string
 * @param {Object} options
 *        - timeout unit ms, default is 10's
 *        - maxBuffer default is 200k
 * @param {Function} cb()
 */
exports.exec = function (command, options, cb) {
  if ('function' === typeof options) {
    cb = options;
    options = {};
  }
  if (options.timeout === undefined) {
    options.timeout = 120000;
  }
  log.info(`exec command: ${command}`);
  childProcess.exec(command, options, function (err, stdout, stderr) {
    if (err) {
      // Mac 下打包的tgz文件和linux下不一致，但不影响解压，只是会报如下信息的错误, 所有当此错误时忽略
      if (err.stack && err.stack.indexOf('tar: Ignoring unknown extended header keyword') < 0) {
        log.error(`exec command: ${command} failed`, err);

        return cb(err, [stdout, stderr]);
      }
    }

    return cb(null, [stdout, stderr]);
  });
};

exports.parseAppId = function (appId) {
  const tmp = appId.split('_');
  let version = '0.0.0';
  let appName;
  let buildNum = 0;

  if (tmp.length === 1) {
    appName = appId;
  } else if (tmp.length === 2) {
    version = tmp.pop();
    if (!/^\d+\.\d+\.\d+$/.test(version)) {
      version = '0.0.0';
      appName = appId;
    } else {
      appName = tmp;
    }
  } else if (tmp.length >= 3) {
    buildNum = tmp.pop();
    if (!/^\d+$/.test(buildNum)) {
      if (/^\d+\.\d+\.\d+$/.test(buildNum)) {
        version = buildNum;
        appName = tmp.join('_');
      } else {
        version = '0.0.0';
        appName = appId;
      }
      buildNum = 0;
    } else {
      version = tmp.pop();
      if (!/^\d+\.\d+\.\d+$/.test(version)) {
        tmp.push(version);
        appName = tmp.join('_');
        version = '0.0.0';
      } else {
        appName = tmp.join('_');
      }
    }
  }

  return {
    name: appName,
    version: version,
    buildNum: buildNum,
    id: appId,
    weight: genWeight(version || '0.0.0.0', buildNum),
    md5: ''
  };
};

exports.sign = function (queryPath, options, token) {
  let contentMd5;
  const date = new Date().toGMTString();
  const accept = 'application/json';
  const contentType = options.headers['content-type'] ||
  options.headers['Content-Type'] ||
  'application/json';


  if (['POST', 'PUT', 'PATCH'].indexOf(options.method) >= 0) {
    const tmp = options.data ? JSON.stringify(options.data) : '';

    contentMd5 = exports.md5base64(tmp);
  } else {
    contentMd5 = '';
    if (options.data) {
      const tmp = url.parse(queryPath, true);

      _.merge(tmp.query, options.data);
      queryPath = tmp.pathname + '?' + qs.stringify(tmp.query);
    }
    options.data = undefined;
  }

  // eslint-disable-next-line
  const stringToSign = `${options.method}\n${accept}\n${contentMd5}\n${contentType}\n${date}\n${queryPath}`;

  options.headers['Content-Type'] = contentType;
  // log.debug('String to be signed: ', stringToSign,queryPath);
  const signature = exports.sha1(stringToSign, token);

  options.headers.Authorization = `system admin:${signature}`;
  options.headers.Date = date;

  return {
    signature: signature,
    queryPath: queryPath
  };
};
/**
 * call cluster endpoint
 * @param  {String}   queryPath  路径
 * @param  {Object}   options  [description]
 * @param  {Function} callback [description]
 */
exports.callremote = function (queryPath, options, callback, maxRetry) {
  let endpoint = options.endpoint;
  const token = options.token;
  const ips = options.ips.join(',');
  const defaultOptions = {
    method: 'GET',
    headers: {},
    timeout: 15000,
    dataType: 'json',
    rejectUnauthorized: false
  };

  options = _.merge(defaultOptions, options);

  if (queryPath.indexOf('?') === -1) {
    queryPath += '?ips=' + ips;
  } else {
    queryPath += '&ips=' + ips;
  }
  if (options.timeout) {
    queryPath += '&timeout=' + timeout;
  }
  if (endpoint.endsWith('/')) {
    endpoint = endpoint.substring(0, endpoint.length - 1);
  }
  delete options.endpoint;
  delete options.token;
  delete options.ips;

  const signed = exports.sign(queryPath, options, token);
  const qpath = endpoint + signed.queryPath;

  log.debug(`${options.method} ${qpath}`);

  let retry = 0;
  function done(err, data, res) {
    if (err) {
      if (maxRetry && retry < maxRetry) {
        retry ++;
        return urllib.request(qpath, options, done);
      } else {
        callback(err);
      }
    } else {
      callback(null, data, res);
    }
  }
  urllib.request(qpath, options, done);
};

/**
 * 把版本号和 build号计算成权重值，方便排序
 */
function genWeight(version, buildNum) {
  let tmp = version.split('.');

  tmp = _.reverse(tmp);
  let weight = 0;

  tmp.forEach(function (t, i) {
    weight += Number(t) * Math.pow(1000, i);
  });
  weight += Number(buildNum) / 1000;

  return weight;
}
// 对 server 接口 /api/apps 的返回做处理，合并apps信息
exports.mergeAppInfo = function (ips, apps) {
  const result = {};

  apps.forEach(function (app) {
    const name = app.name;
    const id = app.appId;
    const ip = app.ip;
    const version = app.version;
    const buildNum = app.buildNum;
    const publishAt = app.publishAt;
    const workerNum = app.workerNum;
    const isCurrWorking = app.isCurrWorking;
    const expectWorkerNum = app.expectWorkerNum;
    const vkey = app.version + '_' + app.buildNum;

    // create app object
    if (!result[name]) {
      result[name] = {
        name: name,
        versions: {}
      };
    }

    const appObj = result[name];
    const versions = appObj.versions;

    if (!versions[vkey]) {
      versions[vkey] = {
        version: version,
        buildNum: buildNum,
        publishAt: publishAt,
        appId: id,
        weight: genWeight(version || '0.0.0.0', buildNum),
        cluster: {},
        isCurrWorking: isCurrWorking
      };
    }

    const cluster = versions[vkey].cluster;

    if (!cluster[ip]) {
      cluster[ip] = {
        ip: ip,
        status: app.status,
        workerNum: workerNum,
        expectWorkerNum: expectWorkerNum,
        errorExitCount: app.errorExitCount,
        errorExitRecord: app.errorExitRecord
      };
    }
  });

  const data = [];

  Object.keys(result).forEach(function (key) {
    const app = result[key];
    const versions = app.versions;
    const vlist = [];

    Object.keys(versions).forEach(function (v) {
      const version = versions[v];
      const cluster = version.cluster;
      const vms = [];

      Object.keys(cluster).forEach(function (vm) {
        vms.push(cluster[vm]);
      });

      // 补齐cluster， 如果某个ip没有app，设置status为none
      ips.forEach(function (ip) {
        const idx = _.findIndex(vms, function (vm) {
          return ip === vm.ip;
        });

        if (idx < 0) {
          vms.push({
            ip: ip,
            status: 'none'
          });
        }
      });

      vms.sort(function (a, b) {
        if (a.ip > b.ip) {
          return 1;
        } else {
          return -1;
        }
      });
      version.cluster = vms;
      vlist.push(version);
    });
    vlist.sort(function (a, b) {
      if (a.weight > b.weight) {
        return 1;
      } else {
        return -1;
      }
    });
    app.versions = vlist;
    data.push(app);
  });
  data.sort(function (a, b) {
    if (a.name > b.name) {
      return 1;
    } else {
      return -1;
    }
  });

  return data;
};


exports.getClusterApps = function (clusterIinfo, cb, maxRetry) {
  const path = '/api/apps';

  clusterIinfo.timeout = 5000;
  exports.callremote(path, clusterIinfo, function (err, result) {
    if (err || result.code !== 'SUCCESS') {
      return cb(err);
    } else {
      const ips = [];
      let apps = [];

      result.data.success.forEach((item) => {
        ips.push(item.ip);
        apps = apps.concat(item.apps);
      });

      apps = exports.mergeAppInfo(ips, apps);
      const res = [];

      apps.forEach((app) => {
        if (/^__\w+__$/.test(app.name)) {
          return;
        }
        let onlineApps = [];
        app.versions.forEach((v) => {
          if (v.isCurrWorking) {
            onlineApps.push(v);
          }
        });
        onlineApps.sort((a, b) => {
          return a.weight > b.weight ? -1 : 1;
        });
        app.versions = onlineApps.slice(0, 2);
        res.push(app);
      });
      cb(null, res);
    }
  }, maxRetry);
};
const secretFieldNameList = [
  /password/,
  /passwd/
];

// 找到config对象中字段名符合secretFieldNameList中模式的路径
function getSecretFields(config, root = '') {
  const configType = Object.prototype.toString.call(config).slice(8, -1);

  if (configType !== 'Object' && configType !== 'Array')
    return [];

  return _.flatten(
    _.map(Object.keys(config),
      key => _.some(secretFieldNameList, pattern => pattern.test(key)) ?
        root + key :
        getSecretFields(config[key], root + key + '.')
    ));
}
// 隐藏字符串中间部分 rate = 隐藏比例
function hideMid(str, char = '*', rate = 0.5) {
  const count = str.length * rate | 0;

  return str.slice(0, Math.ceil(count / 2)) +
    char.repeat(str.length - count) +
    str.slice(str.length - Math.floor(count / 2));
}
// 隐藏config对象中涉及隐私部分的字段值
exports.configRemoveSecretFields = function (oldConfig, newConfig) {
  oldConfig = _.cloneDeep(oldConfig);
  newConfig = _.cloneDeep(newConfig);
  getSecretFields(newConfig).forEach(path => {
    const oldValue = _.get(oldConfig, path, '');
    const newValue = _.get(newConfig, path, '');

    if (oldValue === newValue) {
      _.set(oldConfig, path, '******');
      _.set(newConfig, path, '******');
    } else {
      _.set(oldConfig, path, hideMid(oldValue, '#'));
      _.set(newConfig, path, hideMid(newValue));
    }
  });

  return [oldConfig, newConfig];
};
const getIpOfForward = (forwarded) => {
  if (!forwarded) {
    return;
  }

  const ips = forwarded.split(',');

  return ips[ips.length - 1];
};

exports.getIp = (req) => {
  return _.get(req, 'headers.x-real-ip') ||
  getIpOfForward(_.get(req, 'headers.x-forwarded-for')) ||
  _.get(req, 'connection.remoteAddress') ||
  _.get(req, 'socket.remoteAddress') ||
  _.get(req, 'connection.socket.remoteAddress') || '127.0.0.1';
};
