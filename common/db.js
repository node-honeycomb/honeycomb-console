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
  case 'postgres':
    module.exports = require('./postgres');
    break;
  default:
    throw new Error('unknow driver, meta config error');
}

if (!module.exports.quoteIdentifier) {
  module.exports.quoteIdentifier = identifier => identifier;
}

module.exports.genSqlWithParamPlaceholder = function (sqlTpl) {
  if (!module.exports.placeholder) {
    return sqlTpl;
  }
  let idx = 0;

  // /\?+/g 来自 sqlstring.format
  return sqlTpl.replaceAll(/\?+/g, function (mysqlPlaceholder) {
    idx++;
    if (module.exports.placeholder instanceof Function) {
      return module.exports.placeholder(mysqlPlaceholder, idx);
    } else {
      return module.exports.placeholder;
    }
  });
};
