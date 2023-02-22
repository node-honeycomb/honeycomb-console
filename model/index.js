const cluster = require('./cluster');
const user = require('./user');
const pkg = require('./app_package');

exports.init = function (cb) {
  cluster.getClusterCfg(() => {
    user.init(() => {
      pkg.init(cb);
    });
  });
};
