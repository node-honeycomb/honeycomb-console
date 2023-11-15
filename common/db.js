const config = require('../config');
const meta = config.meta;

switch (meta.driver) {
  case 'mysql':
    module.exports = require('./mysql');
    break;
  case 'sqlite':
    module.exports = require('./sqlite');
    break;
  case 'sql.js':
    module.exports = require('./sql.js');
    break;
  case 'dmdb':
    module.exports = require('./dmdb');
    break;
  default:
    throw new Error('unknow driver, meta config error');
}

if (!module.exports.quoteIdentifier) {
  module.exports.quoteIdentifier = identifier => identifier;
}
