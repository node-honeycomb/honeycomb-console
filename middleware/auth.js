const pathToRegex = require('path-to-regexp');
const log = require('../common/log');
const svgCaptcha = require('svg-captcha');

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

    const throwError = (error) => {
      res.status(500);

      return res.send(error);
    };

    switch (path) {
      case '/initUser':
        if (!user || !pwd) {
          res.status(500);
        }

        pwd = utils.sha256(pwd);

        User.countUser((err, data) => {
          if (err) {
            return next(err);
          }

          if (data > 0) {
            return throwError({
              code: ECODE.USER_CREATED,
              message: EMSG.USER_CREATED
            });
          }

          User.addUser(user, pwd, 1, 1, err => {
            if (err) {
              req.log.error('create user failed');
              req.log.error(err);


              return throwError({
                code: ECODE.INIT_USER_FAILED,
                message: EMSG.INIT_USER_FAILED
              });
            }

            res.send({
              code: 'SUCCESS'
            });
          });
        });
        break;
      case '/loginAuth':
        if (!user || !pwd || !captcha) {
          return res.redirect(config.prefix + '?error=user_or_pwd_or_captcha_empty');
        }
        if ((captcha || '').toLowerCase() !== (req.session.captcha || '').toLowerCase()) {
          return res.redirect(config.prefix + '?error=captcha_not_match');
        }

        User.getUser(user, (err, user) => {
          if (err) {
            log.error('login get user failed', err.message);
            return res.redirect(config.prefix + '?error=login_failed');
          }
          pwd = utils.genPwd(pwd, config.salt);
          if (user.password === pwd && user.status === 1) {
            req.session.username = user.name;

            return res.send({code: 'SUCCESS'});
          } else {
            return throwError({
              code: ECODE.LOGIN_FAILED,
              message: EMSG.LOGIN_FAILED
            });
          }
        });
        break;
      case '/loginCaptcha':
        let capt = svgCaptcha.create({
          size: 6, 
          noise: 3, 
          background: '#fff',
          ignoreChars: '0o1il'
        });
        req.session.captcha = capt.text;
        res.type('svg').status(200).send(capt.data);
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
