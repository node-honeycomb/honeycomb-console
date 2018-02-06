const config = require('../config');
const meta = config.meta;
switch (meta.driver) {
  case 'mysql':
    module.exports = require('./sequelize');
    break;
  case 'sqlite':
    module.exports = require('./sequelize');
    break;
  default:
    throw new Error('unknow driver, meta config error');
}
