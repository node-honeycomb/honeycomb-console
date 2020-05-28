const app = require('./app');
const config = require('./config');

module.exports = (router) => {
  if (config.debug && !['production', 'test'].includes(process.env.NODE_ENV)) {
    require('./common/proxy-dev-server')(router, app);
  }
};
