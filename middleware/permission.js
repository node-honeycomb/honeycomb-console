'use strict';

let async = require('async');
let log = require('../common/log');
let pathToRegex = require('path-to-regexp');
let userAclModel = require('../model/user_acl');

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
    let clusterCode = req.query.clusterCode || req.body.clusterCode;
    let fileName = req.query.fileName;
    if (!fileName || !clusterCode) {
      return next();
    }
    if (fileName.indexOf('/') === -1) {
      return next();  
    }

    let appName = '';
    let logFile = fileName.match(/^([^/.]+).+/);
    if (logFile && logFile[1]) {
      appName = logFile[1];
    }

    let isPermitted = user.containsApp(clusterCode, appName);
    isPermitted ? next() : res.status(401).json({
      code: 'Error',
      message: 'Unauthorized'
    });

    return;
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
    // let clusterCode = req.query.clusterCode || req.body.clusterCode;
    // let isPermitted = user.isClusterAdmin(clusterCode);
    // console.log('/api/acl/list', isPermitted, user);
    // isPermitted ? next() : res.status(401).send('Unauthorized');
    // return;
    return next();
  } 

  //用户可以 list 他有权限的集群,结果的过滤在 controller 里进行
  if (pathToRegex('/api/:entity/list').test(pathname)) {
    let clusterCode = req.query.clusterCode || req.body.clusterCode;
    let isPermitted = user.containsCluster(clusterCode);
    console.log('containsCluster', isPermitted, req.user);
    isPermitted ? next() : res.status(401).json({
      code: 'Error',
      message: 'Unauthorized'
    });
    return;
  }

  //系统管理员可以创建新集群
  if (pathToRegex('/api/cluster/create').test(pathname)) {
    let isPermitted = user.isSystemAdmin();
    isPermitted ? next() : res.status(401).json({
      code: 'Error',
      message: 'Unauthorized'
    });
    return;
  }

  //发布要求有集群权限
  if (pathToRegex('/api/app/publish').test(pathname)) {
    return next();
    let clusterCode = req.query.clusterCode || req.body.clusterCode || req.body.cluster_code;
    let isPermitted = user.containsCluster(clusterCode);
    isPermitted ? next() : res.status(401).json({
      code: 'Error',
      message: 'Unauthorized'
    });
    return;
  }

  // create、publish操作需要集群管理权限
  if (pathToRegex('/api/:entity/:action').test(pathname)) {
    let clusterCode = req.query.clusterCode || req.body.clusterCode || req.body.cluster_code;
    let isPermitted = user.isClusterAdmin(clusterCode);
    isPermitted ? next() : res.status(401).json({
      code: 'Error',
      message: 'Unauthorized'
    });
    return;
  }


  //对某个实例的操作，需要查询对该实例的权限
  if (pathToRegex('/api/:entity/:id/:action').test(pathname)) {
    let params = pathname.match(pathToRegex('/api/:entity/:id/:action'));
    let entity = params[1];
    if (['app', 'config'].indexOf(entity) > -1) {
      let appName = params[2];
      let action = params[3];
      let clusterCode = req.query.clusterCode || req.body.clusterCode || req.body.cluster_code;
      let isPermitted = user.containsApp(clusterCode, appName);
      // if (entity === 'config' && action === 'get' && ['common', 'server'].indexOf(appName) > -1) {
      //   isPermitted = true;
      // }
      isPermitted ? next() : res.status(401).json({
        code: 'Error',
        message: 'Unauthorized'
      });
      return;
    }

    if (['cluster', 'acl', 'worker'].indexOf(entity) > -1) {
      let clusterCode = req.query.clusterCode || req.body.clusterCode;
      let isPermitted = user.isClusterAdmin(clusterCode);
      isPermitted ? next() : res.status(401).json({
        code: 'Error',
        message: 'Unauthorized'
      });
      return;
    }
  }
};
