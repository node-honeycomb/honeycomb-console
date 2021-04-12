const pathToRegex = require('path-to-regexp');

const config = require('../config');

module.exports = function (req, res, next) {
  const user = req.user || req.session.user;
  const pathname = req._parsedUrl.pathname;

  // no need to check permission
  if (!pathToRegex('/api/**').test(pathname)) {
    return next();
  }


  // no need to check permission
  if (
    pathToRegex('/api/user').test(pathname) ||
    pathToRegex('/api/user/**/**').test(pathname) ||
    pathToRegex('/api/user/**').test(pathname) ||
    pathToRegex('/api/status').test(pathname) ||
    pathToRegex('/api/coredump').test(pathname) ||
    pathToRegex('/api/unknowProcess').test(pathname) ||
    pathToRegex('/api/unknowProcess/**').test(pathname)
  ) {
    return next();
  }

  // 注册、注销、获取列表接口根据header授权
  if (
    [
      '/api/worker/register',
      '/api/worker/deleteByIp',
      '/api/worker/listAll',
      '/api/cluster/patch'
    ].some(i => pathToRegex(i).test(pathname))
  ) {
    const secret = req.headers.authorization;

    if (config.registerSecret !== secret) {
      res.status(401).json({
        code: 'Error',
        message: 'Unauthorized'
      });

      return;
    }

    return next();
  }

  if (!user) {
    res.status(401).json({
      code: 'Error',
      message: 'Unauthorized'
    });

    return;
  }

  if (pathToRegex('/api/log').test(pathname)) {
    const clusterCode = req.query.clusterCode || req.body.clusterCode;
    const fileName = req.query.fileName;

    if (!fileName || !clusterCode) {
      return next();
    }
    if (fileName.indexOf('/') === -1) {
      return next();
    }

    let appName = '';
    const logFile = fileName.match(/^([^/.]+).+/);

    if (logFile && logFile[1]) {
      appName = logFile[1];
    }

    const isPermitted = user.containsApp(clusterCode, appName);

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

  if (pathToRegex('/api/status').test(pathname)) {
    return next();
  }

  if (pathToRegex('/api/cluster/list').test(pathname)) {
    // 过滤 cluster
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

  // 用户可以 list 他有权限的集群,结果的过滤在 controller 里进行
  if (pathToRegex('/api/:entity/list').test(pathname)) {
    const clusterCode = req.query.clusterCode || req.body.clusterCode;
    const isPermitted = user.containsCluster(clusterCode);

    // log.debug('containsCluster', isPermitted, req.user);
    isPermitted ? next() : res.status(401).json({
      code: 'Error',
      message: 'Unauthorized'
    });

    return;
  }

  // 所有用户都可以创建新集群并成为该集群的管理员, 只有管理员才可以进行更新操作
  if (pathToRegex('/api/cluster/create').test(pathname)) {
    // 更新集群
    if (req.body.isUpdate) {
      user.isClusterAdmin(req.body.code) ? next() : res.status(401).json({
        code: 'Error',
        message: 'Unauthorized'
      });

      return;
    } else {
      // 新建集群
      return next();
    }
  }

  // 发布要求有集群权限
  if (pathToRegex('/api/app/publish').test(pathname)) {
    const clusterCode = req.query.clusterCode || req.body.clusterCode || req.body.cluster_code;
    const isPermitted = user.containsCluster(clusterCode);

    isPermitted ? next() : res.status(401).json({
      code: 'Error',
      message: 'Unauthorized'
    });

    return;
  }

  // create、publish操作需要集群管理权限
  if (pathToRegex('/api/:entity/:action').test(pathname)) {
    const clusterCode = req.query.clusterCode || req.body.clusterCode || req.body.cluster_code;
    const isPermitted = user.isClusterAdmin(clusterCode);

    isPermitted ? next() : res.status(401).json({
      code: 'Error',
      message: 'Unauthorized'
    });

    return;
  }


  // 对某个实例的操作，需要查询对该实例的权限
  if (pathToRegex('/api/:entity/:id/:action').test(pathname)) {
    const params = pathname.match(pathToRegex('/api/:entity/:id/:action'));
    const entity = params[1];

    // 集群用户可以进行的操作
    if (['app', 'config'].indexOf(entity) > -1) {
      const appName = params[2];

      const clusterCode = req.query.clusterCode || req.body.clusterCode || req.body.cluster_code;
      const isPermitted = user.containsApp(clusterCode, appName);

      isPermitted ? next() : res.status(401).json({
        code: 'Error',
        message: 'Unauthorized'
      });

      return;
    }

    // 集群管理员可以进行的操作
    if (['acl', 'worker'].indexOf(entity) > -1) {
      const clusterCode = req.query.clusterCode || req.body.clusterCode;
      const isPermitted = user.isClusterAdmin(clusterCode);

      isPermitted ? next() : res.status(401).json({
        code: 'Error',
        message: 'Unauthorized'
      });

      return;
    }

    if (['cluster'].indexOf(entity) > -1) {
      const clusterCode = params[2];
      const isPermitted = user.isClusterAdmin(clusterCode);

      isPermitted ? next() : res.status(401).json({
        code: 'Error',
        message: 'Unauthorized'
      });

      return;
    }

    res.status(403).json({
      code: 'Error',
      message: 'Forbidden'
    });
  }
  res.status(403).json({
    code: 'Error',
    message: 'Forbidden'
  });
};
