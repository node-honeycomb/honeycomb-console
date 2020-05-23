const promisify = require('util').promisify;
const formstream = require('formstream');
// const CronJob = require('cron').CronJob;
const cluster = require('./model/cluster');
const appConfig = require('./model/app_config');
const appPackage = require('./model/app_package');
const async = require('async');
const _ = require('lodash');
const utils = require('./common/utils');
const log = require('./common/log');

const reflushClusterConfigSync = promisify(cluster.getClusterCfg);
const getSnapshortSync = promisify(cluster.getSnapshort);
const cleanSnapshortSync = promisify(cluster.cleanSnapshort);
const fixClusterSync = promisify(cluster.fixCluster);
const getClusterAppsSync = promisify(utils.getClusterApps);

const getAppConfig = promisify(appConfig.getAppConfig);
const cleanAppConfig = promisify(appConfig.cleanAppConfig);
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

function tick() {
  run().then(() => {
    log.info('run autocheck success');
    setTimeout(tick, 60000);
  }).catch((err) => {
    log.error('run autocheck failed', err);
    setTimeout(tick, 60000);
  });
}

tick();

async function run() {
  await reflushClusterConfigSync();
  let clusters = cluster.getClusterCodes();
  // 遍历snapshort中的所有集群
  for (let i = 0; i < clusters.length; i++) {
    let clusterCode = clusters[i];
    await fixClusterSync(clusterCode);
  }
} 

async function run2() {
  await reflushClusterConfigSync();
  let clusters = cluster.getClusterCodes();
  // 遍历snapshort中的所有集群
  for (let i = 0; i < clusters.length; i++) {
    let clusterCode = clusters[i];
    await fixClusterSync(clusterCode);
    let clusterInfo = cluster.getClusterCfgByCode(clusterCode);

    let clusterSnp = await getSnapshortSync(clusterCode);
    if (!clusterSnp) {
      continue;
    }

    // 检查 server 配置，并更新 + reload
    let flagServerCfgChange = await recoverServerConfig(clusterCode, clusterInfo, 'server', 'server');
    let flagCommonCfgChange = await recoverServerConfig(clusterCode, clusterInfo, 'server', 'common');
    let flagReload = flagServerCfgChange || flagCommonCfgChange;
    if (flagReload) {
      log.warn('global config(server/common) changed, cluster should reload');
    }
    // 获取到当前集群的app信息
    let appsLiveCluster = await live.getClusterAppsSync(clusterInfo);
    let md5New = utils.md5(JSON.stringify(appsLiveCluster));
    if (md5New === clusterSnp.md5) {
      // 如果集群配置有变更，需要reload
      if (flagReload) {
        log.info('global config(server/common) changed, reload cluster');
        await reloadCluster(appsLiveCluster, clusterInfo).catch((e) => {
          log.error('reload cluster error', $clusterCode, e);
        });
      }
      log.info(`cluster "${clusterCode}" has no change, skip`);
      continue;
    }
    // log.info('live app info', JSON.stringify(appsLiveCluster, null, 2));
    // 建立集群现场的appId map
    let appsLiveClusterMap = {};
    appsLiveCluster.forEach((app) => {
      app.versions.forEach((v) => {
        appsLiveClusterMap[v.appId] = v;
      });
    });
    let appsSnapshort = clusterSnp.info;
    // 遍历snapshort中的app, 将配置和app发布到新机器
    for (let n = 0; n < appsSnapshort.length ; n++) {
      let app = appsSnapshort[n];
      let appName = app.name;
      let versions = app.versions;
      for (let m = 0; m < versions.length; m++) {
        let v = versions[m];
        let vNow = appsLiveClusterMap[v.appId];
        let flagRunInSnapshort = false;
        for (let k = 0; k < v.cluster.length; k++) {
          if (v.cluster[k].status === 'online') {
            flagRunInSnapshort = true;
          }
        }

        if (!vNow) { 
          // 线上并无snapshort中的app版本，则新增app版本上去
          log.info(`app: ${v.appId}  missing in whole cluster: ${clusterCode}, recover app`);
          // app版本缺失，两种情况：1. 完全没有，2.单边机器有
          await recoverApp(clusterCode, clusterInfo, appName, v);
        } else {
          // 线上有snapshort中的app版本
          // 则判断集群中该版本的app是否都有
          let flagInLive = true;
          for (let k = 0; k < vNow.cluster.length; k++) {
            if (vNow.cluster[k].status === 'none') {
              flagInLive = false;
              log.info(`app ${v.appId} missing in worker: ${vNow.cluster[k].ip} cluster: ${clusterCode}`);
            }
          }
          recoverApp(clusterCode, clusterInfo, appName, v, flagInLive, !flagRunInSnapshort);
        }

        if (flagReload) {
          reloadApp(clusterInfo, v.appId);
        }
      }
    };
  }
}

async function recoverApp(clusterCode, clusterInfo, appName, v, appExist, appStoped) {
  let appConfig = await getAppConfig(clusterCode, 'app', appName);
  let appPkg = await getAppPackage(clusterCode, v.appId);
  if (appConfig) {
    await recoverAppConfig(clusterCode, clusterInfo, 'app', appName, appConfig.config);
  }
  if (!appPkg) {
    log.warn(`app ${v.appId} package not stored, skip package recover`);
  } else {
    if (!appExist) {
      log.info(`app ${v.appId} recover package`);
      await recoverAppPackage(clusterCode, clusterInfo, appPkg);
    } else {
      log.info(`app ${v.appId} package is well`);
    }
  }

  if (appStoped) {
    await stopApp(clusterInfo, v.appId);
  } else {
    await startApp(clusterInfo, v.appId);
    await reloadApp(clusterInfo, v.appId);
  }
};

async function recoverServerConfig(clusterCode, clusterInfo, type, name) {
  let clusterServerCfg = await live.getCluserConfig(clusterInfo, type, name);
  let clusterSnapShortCfg = await getAppConfig(clusterCode, type, name);
  if (!clusterSnapShortCfg) {
    log.warn(`cluster config, ${type}/${name} not found, skip`);
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
  log.info('>> recover app package', file);
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
  log.info('>> recover app package success', res);
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

async function stopApp(clusterInfo, appId) {
  let path = `/api/stop/${appId}`;
  let opt = _.cloneDeep(clusterInfo);
  opt.method = 'POST';
  opt.timeout = 30000;
  await callremote(path, opt).catch((err) => {
    log.error('stop app failed', err.message);
  });
}

