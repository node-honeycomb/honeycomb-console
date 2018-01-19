'use strict';
const utils = require('../common/utils');
const userModel = require('../model/user');
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
      userModel.countUser((err, data) => {
        if (err) {
          return next(err);
        }
        if (data.length) {
          return next(new Error('root user all ready inited'));
        }
        userModel.addUser(user, pwd, 1, 1, (err) => {
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
      userModel.getUser(user, (err, data) => {
        if (err) {
          return res.redirect('/?error=' + err.message);
        }
        if (!data || !data.length) {
          return res.redirect('/?error=user_not_found');
        }
        data = data[0];
        pwd = utils.sha256(pwd);
        if (data.password === pwd) {
          req.session.user = {
            name: user,
            nickname: user,
            role: data.role
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
      userModel.countUser((err, data) => {
        let errmsg;
        if (err) {
          errmsg = err.message;
        } else {
          errmsg = req.query.error || '';
        }
        res.render('login.html', {
          userCount: data.length ? data[0].count : 0,
          errMsg: errmsg,
          csrfToken: req.csrfToken()
        });
      });
  }
  //let user = req.session.user;
  /*
  if (config.whiteList.indexOf(user.nickname) >= 0) {
    next();
  } else {
    switch (path) {
      case '/pages/clusterMgr':
      case '/api/clusterCfg':
      case '/api/worker':
      case '/api/config':
      case '/pages/appsConfig':
        res.end('forbidden');
        break;
      default:
        next();
    }
  }
  */
};
