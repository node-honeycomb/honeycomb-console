const testMod = require('../../model/app_package.js');

const path = require('path');

let data = {
  clusterCode: 'test',
  appId: 'simple-app_1.1.0_1',
  appName: 'simple-app',
  appWeight: 10000,
  user: 'test',
  pkg: path.join(__dirname, '../../../honeycomb-server/example-apps/simple-app_1.1.0_1.tgz')
};

setTimeout(() => {
  testMod.savePackage(data, (err, d) => {
    console.log(err, d);
    testMod.getPackage(data.clusterCode, data.appId, (err, dd) => {
      console.log(err, dd);
    });
  });
}, 1000);
