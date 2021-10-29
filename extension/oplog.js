const moment = require('moment');
const oplog = require('../model/oplog');
const utils = require('../common/utils');
const emitOplog = require('../monitor/emit-op-log');

module.exports = function (app) {
  app.express.request.oplog = function (data, appendDetail = true) {
    const user = this.user || this.session.user;
    const clusterCode = this.query.clusterCode || this.body.clusterCode ||
     '_system_manage';

    oplog.add({
      gmtCreate: moment().format('YYYY-MM-DD HH:mm:ss'),
      username: user.name,
      socket: {
        address: utils.getIp(this),
      },
      clusterCode,
      detail: appendDetail ? {
        originalUrl: this.originalUrl,
        params: this.params,
        query: this.query,
        body: this.body
      } : {},
      ...data
    });

    if (data.opName === 'UPDATE_CLUSTER') {
      emitOplog(this.body.code, user.name, data);
    } else {
      clusterCode !== '_system_manage' &&
      emitOplog(clusterCode, user.name, data);
    }
  };
};
