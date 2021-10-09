const _ = require('lodash');
const util = require('util');


// eslint-disable-next-line
const DETECT_SQL = "SELECT 1 FROM information_schema.columns WHERE table_name='hc_console_system_cluster' AND COLUMN_NAME='monitor'";
// eslint-disable-next-line
const PATCH_SQL = 'ALTER TABLE `hc_console_system_cluster` ADD COLUMN  `monitor` varchar(256) DEFAULT NULL;';

/**
 * js对mysql进行逻辑判断
 * @param {Mysql.Connection} connection
 */
module.exports = async (connection) => {
  if (!connection) {
    return;
  }

  const query = util.promisify(connection.query).bind(connection);

  const result = await query(DETECT_SQL);

  const isExsit = _.get(result, ['0', '1']);

  if (isExsit) {
    return;
  }

  await query(PATCH_SQL);
};
