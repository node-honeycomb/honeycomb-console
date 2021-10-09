const log = require('../common/log');
const oplog = log.get('oplog');

module.exports = function (app) {
  app.express.request.oplog = function (data, appendDetail = true) {
    const user = this.user || this.session.user;
    const clusterCode = this.query.clusterCode || this.body.clusterCode;

    oplog.info(JSON.stringify({
      time: Date.now(),
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
    })// .replace('\n', '\\n')
    );
  };
  app.express.request.oplog.logFile = oplog.logFile;
};
