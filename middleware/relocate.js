const config = require('../config');

module.exports = function (app, options) {
  let host = options.host;
  return function (req, res, next) {
    //  未设置host跳转，直接走
    if (!host) {
      return next();
    }
    let reqHost = req.headers['host'];
    if (reqHost !== host) {
      return res.redirect('//' + host + req.originalUrl);
    }
    next();
  }
};