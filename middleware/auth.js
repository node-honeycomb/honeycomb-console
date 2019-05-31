'use strict';
const utils = require('../common/utils');
const User = require('../model/user');
const config = require('../config');
/**
 * [exports description]
 * @return {[type]} [description]
 */
module.exports = function (req, res, next) {
  let path = req.path;
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
        User.addUser(user, pwd, 1, 1, (err) => {
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
        return res.redirect(config.prefix + '?error=user_or_pwd_empty');
      }
      User.getUser(user, (err, user) => {
        if (err) {
          return res.redirect(config.prefix + '?error=' + err.message);
        }
        pwd = utils.sha256(pwd);
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
