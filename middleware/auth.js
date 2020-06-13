const pathToRegex = require('path-to-regexp');

const config = require('../config');
const User = require('../model/user');
const utils = require('../common/utils');
const {ECODE, EMSG} = require('../common/error');

/**
 * [exports description]
 * @return {[type]} [description]
 */
module.exports = function (app, options) {
  const ignorePathRegex = options.ignore ? pathToRegex(options.ignore) : null;

  return function (req, res, next) {
    const path = req.path;

    if (ignorePathRegex && ignorePathRegex.test(path)) {
      return next();
    }
    // if already login
    if (req.session && req.session.username) {
      if (path === '/logout') {
        req.session.user = null;
        req.session = null;
        res.redirect(req.headers.referer || config.prefix);

        return;
      }

      return next();
    }

    const user = req.body.username;
    let pwd = req.body.password;

    switch (path) {
      case '/initUser':
        if (!user || !pwd) {
          return res.redirect(config.prefix + '?error=user_or_pwd_empty');
        }
        pwd = utils.sha256(pwd);
        User.countUser((err, data) => {
          if (err) {
            return next(err);
          }
          if (data > 0) {
            return next(new Error('root user all ready inited'));
          }
          User.addUser(user, pwd, 1, 1, err => {
            let target = config.prefix;

            if (err) {
              target += '?error=' + err.message;
            }
            res.redirect(target);
          });
        });
        break;
      case '/loginAuth':
        if (!user || !pwd) {
          res.status(500);

          return res.send({
            code: ECODE.LOGIN_FAILED,
            message: EMSG.LOGIN_TICKET_EMPTY
          });
        }

        User.getUser(user, (err, user) => {
          if (err) {
            res.status(500);

            if (err.message === 'user not found') {
              return res.send({
                code: ECODE.LOGIN_FAILED,
                message: EMSG.USER_NOT_FOUND
              });
            }

            return res.send({
              code: ECODE.LOGIN_FAILED,
              message: EMSG.QUERY_USER_UFAILED
            });
          }

          pwd = utils.sha256(pwd);
          if (user.password === pwd && user.status === 1) {
            req.session.username = user.name;

            return res.send({code: 'SUCCESS'});
          } else {
            res.status(500);

            return res.send({
              code: ECODE.LOGIN_FAILED,
              message: EMSG.LOGIN_FAILED
            });
          }
        });
        break;
      case '/api/worker/register':
      case '/api/worker/unregister':
      case '/api/worker/listAll':
      case '/api/worker/deleteByIp':
      case '/api/cluster/patch':
        next();
        break;
      default:
        User.countUser((err, count) => {
          let errmsg;

          if (err) {
            errmsg = err.message;
          } else {
            errmsg = req.query.error || '';
          }

          res.render('login.html', {
            prefix: config.prefix !== '/' ? config.prefix : '',
            userCount: count,
            errMsg: errmsg,
            csrfToken: req.csrfToken && req.csrfToken()
          });
        });
    }
  };
};
