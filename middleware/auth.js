'use strict';
const utils = require('../common/utils');
const User = require('../model/user');
/**
 * [exports description]
 * @return {[type]} [description]
 */
module.exports = function (req, res, next) {
  let path = req.path;
  // if already login
  if (req.session && req.session.user) {
    return next();
  }

  let user = req.body.username;
  let pwd = req.body.password;

  switch (path) {
    case '/initUser':
      if (!user || !pwd) {
        return res.redirect('/?error=user_or_pwd_empty');
      }
      pwd = utils.sha256(pwd);
      User.countUser((err, data) => {
        if (err) {
          return next(err);
        }
        if (data.length) {
          return next(new Error('root user all ready inited'));
        }
        User.addUser(user, pwd, 1, 1, (err) => {
          let target = '/';
          if (err) {
            target += '?error=' + err.message;
          }
          res.redirect(target);
        });
      });
      break;
    case '/loginAuth':
      if (!user || !pwd) {
        return res.redirect('/?error=user_or_pwd_empty');
      }
      User.getUser(user, (err, user) => {
        if (err) {
          return res.redirect('/?error=' + err.message);
        }
        pwd = utils.sha256(pwd);
        if (user.password === pwd) {
          req.session.user = {
            name: user,
            nickname: user,
            role: user.role
          };
          return res.redirect('/');
        } else {
          return res.redirect('/?error=login_failed');
        }
      });
      break;
    case '/logout':
      req.session.user = null;
      res.redirect('/');
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
          userCount: count,
          errMsg: errmsg,
          csrfToken: req.csrfToken()
        });
      });
  }
};
