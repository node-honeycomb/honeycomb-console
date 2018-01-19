const log = require('../common/log');
const oplog = log.get('oplog');
module.exports = function (app) {
  app.express.request.oplog = function (data) {
    oplog.info(JSON.stringify(data));
  };
};
