const promisify = require('util').promisify;
const formstream = require('formstream');
const _ = require('lodash');
const cluster = require('./model/cluster');
const appConfig = require('./model/app_config');
const appPackage = require('./model/app_package');
const utils = require('./common/utils');
const log = require('./common/log');

const reflushClusterConfigSync = promisify(cluster.getClusterCfg);
const getSnapshortSync = promisify(cluster.getSnapshort);
const fixClusterSync = promisify(cluster.fixCluster);


const getAppConfig = promisify(appConfig.getAppConfig);
const getAppPackage = promisify(appPackage.getPackage);
const callremote = promisify(utils.callremote);

const live = {
  getClusterAppsSync: promisify(utils.getClusterApps),
  getCluserConfig: async function (clusterInfo, type, appName) {
    const path = `/api/config/${type}/${appName}`;
    const opt = _.cloneDeep(clusterInfo);
    const res = await callremote(path, opt).catch((e) => {
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
  const clusters = cluster.getClusterCodes();

  // 遍历snapshort中的所有集群
  for (let i = 0; i < clusters.length; i++) {
    const clusterCode = clusters[i];

    await fixClusterSync(clusterCode);
  }
}

async function run2() {
  await reflushClusterConfigSync();
  const clusters = cluster.getClusterCodes();

  // 遍历snapshort中的所有集群
  for (let i = 0; i < clusters.length; i++) {
    const clusterCode = clusters[i];

    await fixClusterSync(clusterCode);
    const clusterInfo = cluster.getClusterCfgByCode(clusterCode);

    const clusterSnp = await getSnapshortSync(clusterCode);

    if (!clusterSnp) {
      continue;
    }

    // 检查 server 配置，并更新 + reload
    const flagServerCfgChange = await recoverServerConfig(clusterCode, clusterInfo, 'server', 'server');
    const flagCommonCfgChange = await recoverServerConfig(clusterCode, clusterInfo, 'server', 'common');
    const flagReload = flagServerCfgChange || flagCommonCfgChange;

    if (flagReload) {
      log.warn('global config(server/common) changed, cluster should reload');
    }
    // 获取到当前集群的app信息
    const appsLiveCluster = await live.getClusterAppsSync(clusterInfo);
    const md5New = utils.md5(JSON.stringify(appsLiveCluster));

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
    const appsLiveClusterMap = {};

    appsLiveCluster.forEach((app) => {
      app.versions.forEach((v) => {
        appsLiveClusterMap[v.appId] = v;
      });
    });
    const appsSnapshort = clusterSnp.info;

    // 遍历snapshort中的app, 将配置和app发布到新机器
    for (let n = 0; n < appsSnapshort.length; n++) {
      const app = appsSnapshort[n];
      const appName = app.name;
      const versions = app.versions;

      for (let m = 0; m < versions.length; m++) {
        const v = versions[m];
        const vNow = appsLiveClusterMap[v.appId];
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
    }
  }
}

async function recoverApp(clusterCode, clusterInfo, appName, v, appExist, appStoped) {
  const appConfig = await getAppConfig(clusterCode, 'app', appName);
  const appPkg = await getAppPackage(clusterCode, v.appId);

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
}

async function recoverServerConfig(clusterCode, clusterInfo, type, name) {
  const clusterServerCfg = await live.getCluserConfig(clusterInfo, type, name);
  const clusterSnapShortCfg = await getAppConfig(clusterCode, type, name);

  if (!clusterSnapShortCfg) {
    log.warn(`cluster config, ${type}/${name} not found, skip`);

    return;
  }
  const presistCfg = JSON.stringify(clusterSnapShortCfg.config);
  let flagDiff = false;

  clusterServerCfg.forEach((server) => {
    const tmpConfig = JSON.stringify(server.data);

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
async function recoverAppConfig(clusterCode, clusterInfo, type, appName, config) {
  const path = `/api/config/${type}/${appName}`;
  const opt = _.cloneDeep(clusterInfo);

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
  const form = formstream();

  form.file('pkg', file.package, file.appId + '.tgz');
  const opt = _.cloneDeep(clusterInfo);
  const path = '/api/publish';

  opt.method = 'POST';
  opt.headers = form.headers();
  opt.stream = form;
  opt.timeout = 1000000;
  const res = await callremote(path, opt).catch((err) => {
    log.error('recover app package failed', err.message);
  });

  log.info('>> recover app package success', res);
}

/**
 * reload 整个集群的app
 */
async function reloadCluster(clusterInfo, appsLiveCluster) {
  for (let i = 0; i < appsLiveCluster.length; i++) {
    const app = appsLiveCluster[i];
    const name = app.name;

    for (let n = 0; n < app.versions.length; n++) {
      const version = app.versions[n];

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
async function reloadApp(clusterInfo, appId) {
  const path = `/api/reload/${appId}`;
  const opt = _.cloneDeep(clusterInfo);

  opt.method = 'POST';
  opt.timeout = 60000;
  await callremote(path, opt).catch((err) => {
    log.error('reload app failed', err.message);
  });
}

async function startApp(clusterInfo, appId) {
  const path = `/api/start/${appId}`;
  const opt = _.cloneDeep(clusterInfo);

  opt.method = 'POST';
  await callremote(path, opt).catch((err) => {
    log.error('reload app failed', err.message);
  });
}

async function stopApp(clusterInfo, appId) {
  const path = `/api/stop/${appId}`;
  const opt = _.cloneDeep(clusterInfo);

  opt.method = 'POST';
  opt.timeout = 30000;
  await callremote(path, opt).catch((err) => {
    log.error('stop app failed', err.message);
  });
}

