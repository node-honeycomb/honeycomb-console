'use strict';
const utils = require('../common/utils');
const User = require('../model/user');
const config = require('../config');
const pathToRegex = require('path-to-regexp');
const log = require('../common/log');
const captcha = require('svg-captcha');

/**
 * [exports description]
 * @return {[type]} [description]
 */
module.exports = function(app, options) {
  const ignorePathRegex = options.ignore ? pathToRegex(options.ignore) : null;
  return function(req, res, next) {
    let path = req.path;
    // 排除掉的路径
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

    let user = req.body.username;
    let pwd = req.body.password;
    let captcha = req.bodu.captcha;

    switch (path) {
      case '/initUser':
        if (!user || !pwd) {
          return res.redirect(config.prefix + '?error=user_or_pwd_empty');
        }
        pwd = utils.genPwd(pwd, config.salt);
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
        if (!user || !pwd || !captcha) {
          return res.redirect(config.prefix + '?error=user_or_pwd_or_captcha_empty');
        }
        if (captcha !== req.session.captcha) {
          return res.redirect(config.prefix + '?error=captcha_not_match');
        }
        User.getUser(user, (err, user) => {
          if (err) {
            log.error('login get user failed', err.message);
            return res.redirect(config.prefix + '?error=login_failed');
          }
          pwd = utils.genPwd(pwd, config.salt);
          if (user.password === pwd && user.status === 1) {
            // req.session.user = {
            //   name: user.name,
            //   role: user.role
            // };
            req.session.username = user.name;
            return res.redirect(config.prefix);
          } else {
            return res.redirect(config.prefix + '?error=login_failed');
          }
        });
        break;
      case '/loginCaptcha':
        let capt = captcha.create({
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
