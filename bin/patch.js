#!/usr/bin/env node

const lodash = require('lodash');
const cp = require('child_process');
const xfs = require('xfs');
const promisify = require('util').promisify;
const log = require('hc-bee/log');
let config = require('../config');

function sleep(timeountMS) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeountMS);
  });
}

// get honeycomb-console's config in honeycomb-server
let sConfig = {};

try {
  sConfig = require('/home/admin/honeycomb/conf/config.js');
} catch (e) {
  // do nothing
}
let aConfig = {};

try {
  aConfig = require('/home/admin/honeycomb/conf/custom/apps/honeycomb-console.json');
} catch (e) {
  // do nothing
}

config = lodash.merge(config, sConfig.appsCommon || {}, sConfig.apps['honeycomb-console'] || {}, aConfig);
config.logs.sys = {level: 'WARN'};

// mock log

log.init(config.logs);

const db = require('../common/mysql');
const dbReady = promisify(db.ready);

const patchSh = `
if [ ! -d /home/admin/honeycomb/conf/custom/apps/ ]; then
  mkdir -p /home/admin/honeycomb/conf/custom/apps/
fi

if [ -d ./run/appsRoot ]; then
  cp -rf ./run/appsRoot/* /home/admin/honeycomb/run/appsRoot/
fi
if [ -f ./conf/custom/server.json ]; then
  cp -rf ./conf/custom/server.json /home/admin/honeycomb/conf/custom/server.json
fi
if [ -f ./conf/custom/common.json ]; then
  cp -rf ./conf/custom/common.json /home/admin/honeycomb/conf/custom/common.json
fi
if [ -d ./conf/custom/apps ]; then
  cp -rf ./conf/custom/apps/*.json /home/admin/honeycomb/conf/custom/apps/
fi

if [ -f ./run/app.mount.info.yaml ]; then
  honeycomb-merge /home/admin/honeycomb/run/app.mount.info.yaml ./run/app.mount.info.yaml
fi
`;

const cluster = require('../model/cluster');

(async function () {
  let dir;
  const maxRetry = 10;
  let flagSuccess = false;

  await dbReady();
  for (let i = 0; i < maxRetry; i++) {
    console.log(`try download ${process.argv[2]} patch ${i}`);
    dir = await cluster.downloadPatch(process.argv[2], i >= 9);
    if (dir instanceof Error) {
      console.log('download patch error', dir.message);
      await sleep(2000);
    } else if (!dir) {
      console.log('no patch, skip');

      return true;
    } else {
      console.log('download patch success, at dir:', dir);
      flagSuccess = true;
      break;
    }
  }
  if (!flagSuccess) {
    return process.exit(1);
  }
  // dir 即 patch 包所在
  xfs.sync().mkdir('/home/admin/honeycomb/conf/custom/apps/');
  process.chdir(dir);
  try {
    console.log('[hc-console-patch] try to merge patch');
    const stdout = cp.execSync(patchSh, {
      cwd: dir,
      maxBuffer: 1024 * 1024 * 16
    });

    console.log('[hc-console-patch] merge match success', stdout.toString());
  } catch (e) {
    console.log('[hc-console-patch] merge patch failed', e.message);
    process.exit(1);
  }
})().then(() => {
  // do nothing
  process.exit(0);
}).catch((e) => {
  console.log('patch failed', e);
  process.exit(1);
});
