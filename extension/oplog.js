const moment = require('moment');
const _ = require('lodash');
const oplog = require('../model/oplog');
const utils = require('../common/utils');
const emitOplog = require('../monitor/emit-op-log');

module.exports = function (app) {
  app.express.request.oplog = function (data, appendDetail = true) {
    const user = this.user || this.session.user;
    const clusterCode = this.query.clusterCode || this.body.clusterCode ||
     '_system_manage';

    const body = _.cloneDeep(this.body);

    if (body.token) {
      body.token = '***********************';
    }
    oplog.add({
      gmtCreate: moment().format('YYYY-MM-DD HH:mm:ss'),
      username: (user && user.name) || 'unkown',
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
