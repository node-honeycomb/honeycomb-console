const promisify = require('util').promisify;
const formstream = require('formstream');
const cluster = require('./model/cluster');
const appConfig = require('./model/app_config');
const appPackage = require('./model/app_package');
const async = require('async');
const _ = require('lodash');
const utils = require('./common/utils');
const log = require('./common/log');

const reflushClusterConfigSync = promisify(cluster.getClusterCfg);
const getSnapshortsSync = promisify(cluster.getSnapshorts);
const fixClusterSync = promisify(cluster.fixCluster);
const getClusterAppsSync = promisify(utils.getClusterApps);

const getAppConfig = promisify(appConfig.getAppConfig);
const getAppPackage = promisify(appPackage.getPackage);
const callremote = promisify(utils.callremote);

const live = {
  getClusterAppsSync: promisify(utils.getClusterApps),
  getCluserConfig: async function(clusterInfo, type, appName) {
    let path = `/api/config/${type}/${appName}`;
    let opt = _.cloneDeep(clusterInfo);
    let res = await callremote(path, opt).catch((e) => {
      log.error('getAppConfig failed', e.message);
    });
    if (!res) {
      return null;
    }
    if (res.data.success[0]) {
      return res.data.success;
    } else {
      return null;
    }
  }
};

async function run() {
  await reflushClusterConfigSync();
  let sps = await getSnapshortsSync();

  // 遍历snapshort中的所有集群
  for (let i = 0; i < sps.length; i++) {
    let clusterSnp = sps[i];
    let clusterCode = clusterSnp.clusterCode;
    let appsSnapshort = clusterSnp.info;
    await fixClusterSync(clusterCode);
    let clusterInfo = cluster.getClusterCfgByCode(clusterCode);

    // 检查 server 配置，并更新 + reload
    let flagServerCfgChange = await recoverServerConfig(clusterCode, clusterInfo, 'server', 'server');
    let flagCommonCfgChange = await recoverServerConfig(clusterCode, clusterInfo, 'server', 'common');
    let flagReload = flagServerCfgChange || flagCommonCfgChange;
    console.log('+++', flagReload);
    // 获取到当前集群的app信息
    let appsLiveCluster = await live.getClusterAppsSync(clusterInfo);
    /*
    if (md5New === clusterSnp.md5) {
      log.info(`cluster "${clusterCode}" has no change, skip`);
      // 如果集群配置有变更，需要reload
      if (!flagReload) {
        await reloadCluster(appsLiveCluster, clusterInfo).catch((e) => {
          log.error('reload cluster error', $clusterCode, e);
        });
        return;
      }
      break;
    }
    */
    console.log(JSON.stringify(appsLiveCluster, null, 2));
    // 建立集群现场的appId map
    let appsLiveClusterMap = {};
    appsLiveCluster.forEach((app) => {
      app.versions.forEach((v) => {
        appsLiveClusterMap[v.appId] = v;
      });
    });
    // 遍历snapshort中的app, 将配置和app发布到新机器
    for (let n = 0; n < appsSnapshort.length ; n++) {
      let app = appsSnapshort[n];
      let appName = app.name;
      let versions = app.versions;
      for (let m = 0; m < versions.length; m++) {
        let v = versions[m];
        let vNow = appsLiveClusterMap[v.appId];
        let flagStartInSnapshort = false;
        for (let k = 0; k < v.cluster.length; k++) {
          if (v.cluster[k].status === 'online') {
            flagStartInSnapshort = true;
          }
        }
        let flagNoneInLive = false;
        if (vNow) {
          for (let k = 0; k < vNow.cluster.length; k++) {
            if (vNow.cluster[k].status === 'none') {
              flagNoneInLive = true;
            }
          }
        }
        if (!vNow || flagNoneInLive) {
          console.log('> recover app', v.appId);
          // app版本缺失，两种情况：1. 完全没有，2.单边机器有
          await recoverApp(clusterCode, clusterInfo, appName, v);
        } else {
          // 对比版本间cluster里的差异
          if (flagStartInSnapshort) {
            console.log('> restart app', v.appId);
            startApp(clusterInfo, v.appId);
          }
        }

        if (flagReload) {
          reloadApp(clusterInfo, v.appId);
        }
      }
    };
  }
}

run().then(() => {
  console.log('>>> done');
}).catch((err) => {
  console.log('>> error', err);
});

async function recoverApp(clusterCode, clusterInfo, appName, v) {
  let appConfig = await getAppConfig(clusterCode, 'app', appName);
  let appPkg = await getAppPackage(clusterCode, v.appId);
  if (appConfig) {
    await recoverAppConfig(clusterCode, clusterInfo, type, appName, appConfig.config);
  }
  if (appPkg) {
    await recoverAppPackage(clusterCode, clusterInfo, appPkg);
  }
  await reloadApp(clusterInfo, v.appId);
};

async function recoverServerConfig(clusterCode, clusterInfo, type, name) {
  let clusterServerCfg = await live.getCluserConfig(clusterInfo, type, name);
  let clusterSnapShortCfg = await getAppConfig(clusterCode, type, type);
  if (!clusterSnapShortCfg) {
    return;
  }
  let presistCfg = JSON.stringify(clusterSnapShortCfg.config);
  let flagDiff = false;
  clusterServerCfg.forEach((server) => {
    let tmpConfig = JSON.stringify(server.data);
    if (tmpConfig !== presistCfg) {
      flagDiff = true;
    }
  });

  if (flagDiff) {
    await recoverAppConfig(clusterCode, clusterInfo, type, name, clusterSnapShortCfg.config);
  }
  return flagDiff;
}

/**
 * 发布App配置过去
 */
async function recoverAppConfig(clusterCode, clusterInfo,  type, appName, config) {
  let path = `/api/config/${type}/${appName}`;
  let opt = _.cloneDeep(clusterInfo);
  opt.method = 'POST';
  opt.data = config;
  await callremote(path, opt).catch(function (err) {
    log.error('recover app config failed', err.message);
  });
  log.info('recover app config success');
}
/**
 * 发布app包
 */
async function recoverAppPackage(clusterCode, clusterInfo, file) {
  console.log('>> recover app package', file);
  let form = formstream();
  form.file('pkg', file.package, file.appId + '.tgz');
  let opt = _.cloneDeep(clusterInfo);
  let path = '/api/publish';
  opt.method = 'POST';
  opt.headers = form.headers();
  opt.stream = form;
  opt.timeout = 1000000;
  let res = await callremote(path, opt).catch((err) => {
    log.error('recover app package failed', err.message);
  });
  console.log('>> recover app package success', res);
}

/**
 * reload 整个集群的app
 */
async function reloadCluster(clusterInfo, appsLiveCluster) {
  for(let i = 0; i < appsLiveCluster.length; i++) {
    let app = appsLiveCluster[i];
    let name = app.name;
    for (let n = 0; n < app.versions.length; n++) {
      let version = app.versions[n];
      if (version.cluster[0].status === 'online') {
        await reloadApp(clusterInfo, version.appId);
        console.log(`reload app ${version.appId} done`);
      }
    }
  }
}

/**
 * 重启App，主要确保配置的修改生效
 */
async function reloadApp(clusterInfo,  appId) {
  let path = `/api/reload/${appId}`;
  let opt = _.cloneDeep(clusterInfo);
  opt.method = 'POST';
  opt.timeout = 60000;
  await callremote(path, opt).catch((err) => {
    log.error('reload app failed', err.message);
  });
}

async function startApp(clusterInfo, appId) {
  let path = `/api/start/${appId}`;
  let opt = _.cloneDeep(clusterInfo);
  opt.method = 'POST';
  await callremote(path, opt).catch((err) => {
    log.error('reload app failed', err.message);
  });
}
