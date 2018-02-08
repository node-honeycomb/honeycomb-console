'use strict';

let async = require('async');
let log = require('../common/log');
let pathToRegex = require('path-to-regexp');
let userAclModel = require('../model/user_acl');

let authRegex = {
  appAuth: [
    ''
  ]
}

module.exports = function (req, res, next) {
  let user = req.user || req.session.user;
  let pathname = req._parsedUrl.pathname;

  //no need to check permission
  if (!pathToRegex('/api/**').test(pathname)) {
    return next();
  }

  //no need to check permission
  if (pathToRegex('/api/user').test(pathname) || pathToRegex('/api/status').test(pathname)) {
    return next();
  }

  if (pathToRegex('/api/log').test(pathname)) {
    // handle filename
    return next();
  }

  if (pathToRegex('/api/appUsages').test(pathname)) {
    // filter app
    return next();
  }

  if (pathToRegex('/api/status').test(pathname)) {
    return next();
  } 

  if (pathToRegex('/api/cluster/list').test(pathname)) {
    //过滤 cluster
    return next();
  } 

  // list acl 需要集群管理权限
  if (pathToRegex('/api/acl/list').test(pathname)) {
    let clusterCode = req.query.clusterCode || req.body.clusterCode;
    let isPermitted = user.isClusterAdmin(clusterCode);
    isPermitted ? next() : res.status(401).send('Unauthorized');
    return;
  } 

  //用户可以 list 他有权限的集群,结果的过滤在 controller 里进行
  if (pathToRegex('/api/:entity/list').test(pathname)) {
    let clusterCode = req.query.clusterCode || req.body.clusterCode;
    let isPermitted = user.containsCluster(clusterCode);
    console.log('containsCluster', isPermitted, req.user);
    isPermitted ? next() : res.status(401).send('Unauthorized');
    return;
  }

  //任何用户都可以创建新集群
  if (pathToRegex('/api/cluster/create').test(pathname)) {
    return next();
  }

  // create、publish操作需要集群管理权限
  if (pathToRegex('/api/:entity/:action').test(pathname)) {
    let clusterCode = req.query.clusterCode || req.body.clusterCode;
    let isPermitted = user.isClusterAdmin(clusterCode);
    isPermitted ? next() : res.status(401).send('Unauthorized');
    return;
  }


  //对某个实例的操作，需要查询对该实例的权限
  if (pathToRegex('/api/:entity/:id/:action').test(pathname)) {
    let params = pathname.match(pathToRegex('/api/:entity/:id/:action'));
    let entity = params[1];
    if (['app', 'config'].indexOf(entity) > -1) {
      let appName = params[2];
      let action = params[3];
      let clusterCode = req.query.clusterCode || req.body.clusterCode;
      console.log('ppppp', entity, appName, action);
      let isPermitted = user.containsApp(clusterCode, appName);
      console.log('containsApp', isPermitted, req.user);
      isPermitted ? next() : res.status(401).send('Unauthorized');
      return;
    }

    if (['cluster', 'acl', 'worker'].indexOf(entity) > -1) {
      let clusterCode = params[2];
      let isPermitted = user.isClusterAdmin(clusterCode);
      isPermitted ? next() : res.status(401).send('Unauthorized');
      return;
    }
  }
};
