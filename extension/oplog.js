const moment = require('moment');
const oplog = require('../model/oplog');

module.exports = function (app) {
  app.express.request.oplog = function (data, appendDetail = true) {
    const user = this.user || this.session.user;
    const clusterCode = this.query.clusterCode || this.body.clusterCode ||
     '_system_manage';

    oplog.add({
      gmtCreate: moment().format('YYYY-MM-DD HH:mm:ss'),
      username: user.name,
      socket: {
        address: this.client.remoteAddress,
        port: this.client.remotePort,
        family: this.client.remoteFamily
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
  };
};
