CREATE TABLE IF NOT EXISTS `hc_console_system_cluster` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `name` varchar(128),
  `code` varchar(128) NOT NULL DEFAULT '' UNIQUE,
  `prod` varchar(128) DEFAULT '', -- COMMENT '产品线:'
  `env` varchar(128) DEFAULT '',  -- COMMENT '环境: dev, daily, pre, production'
  `region` varchar(128) DEFAULT '', -- COMMENT '多region: 生产的多套环境'
  `endpoint` text NOT NULL,
  `token` varchar(256) NOT NULL DEFAULT '',
  `description` text,
  `status` tinyint(4) NOT NULL DEFAULT '1',
  `gmt_create` datetime NOT NULL,
  `gmt_modified` datetime NOT NULL
);

CREATE TABLE IF NOT EXISTS `hc_console_system_worker` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `ip` varchar(128) NOT NULL DEFAULT '', -- COMMENT 'worker ip地址',
  `cluster_code` varchar(128) NOT NULL DEFAULT '', -- COMMENT 'worker 所属集群',
  `status` tinyint(4) NOT NULL DEFAULT '1', -- COMMENT '0： 无效， 1：有效',
  `gmt_create` datetime NOT NULL, -- COMMENT '创建时间',
  `gmt_modified` datetime NOT NULL, -- COMMENT '修改时间',
  UNIQUE(`ip`,`cluster_code`)
);

CREATE TABLE IF NOT EXISTS `hc_console_system_worker_tmp` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `ip` varchar(128) NOT NULL DEFAULT '', -- COMMENT 'worker ip地址',
  `cluster_code` varchar(128) NOT NULL DEFAULT '', -- COMMENT 'worker 所属集群',
  `gmt_create` datetime NOT NULL, -- COMMENT '创建时间',
  UNIQUE(`ip`,`cluster_code`)
);

CREATE TABLE IF NOT EXISTS `hc_console_system_user` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `name` varchar(50), -- COMMENT '用户名',
  `password` varchar(64), -- COMMENT 'password',
  `status` INTEGER NOT NULL DEFAULT '1', -- COMMENT '0： 无效， 1：有效',
  `role` INTEGER NOT NULL DEFAULT '0', -- COMMENT '0： 用户， 1：管理员',
  `gmt_create` datetime NOT NULL, -- COMMENT '创建时间',
  `gmt_modified` datetime NOT NULL, -- COMMENT '修改时间',
  UNIQUE(`name`)
);

CREATE TABLE IF NOT EXISTS `hc_console_system_user_acl` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `name` varchar(50) DEFAULT NULL, --COMMENT '用户名',
  `cluster_id` INTEGER NOT NULL,
  `cluster_code` varchar(50) NOT NULL,
  `cluster_name` varchar(50) NOT NULL,
  `cluster_admin` INTEGER NOT NULL DEFAULT '0', --COMMENT '0: cluster用户，1: cluster管理员',
  `apps` text, --COMMENT '用户app列表',
  `gmt_create` datetime NOT NULL, --COMMENT '创建时间',
  `gmt_modified` datetime NOT NULL, --COMMENT '修改时间'
  UNIQUE(`name`, `cluster_code`)
);

-- 储存集群的app的配置
CREATE TABLE IF NOT EXISTS `hc_console_system_cluster_apps_config` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `cluster_code` varchar(50) NOT NULL,
  `type` varchar(16) DEFAULT '', 
  `app` varchar(50) DEFAULT '', -- COMMENT '应用名: server, common, apps/xxx',
  `config` text DEFAULT '', -- COMMENT '配置文件 json string',
  `version` INTEGER, -- COMMENT '版本号',
  `user` varchar(50) DEFAULT '', -- COMMENT '操作人',
  `gmt_create` datetime NOT NULL -- COMMENT '创建时间'
);

-- 储存集群app包
CREATE TABLE IF NOT EXISTS `hc_console_system_cluster_app_pkgs` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `cluster_code` varchar(50) NOT NULL,
  `app_id` varchar(50), -- COMMENT '应用id',
  `app_name` varchar(50),
  `weight` INTEGER,
  `package` blob, -- COMMENT '应用包', -- 默认 1,000,000,000，自定义 -DSQLITE_MAX_LENGTH=123456789  参考 https://www.sqlite.org/limits.html
  `user` varchar(50), -- COMMENT '操作人',
  `gmt_create` datetime NOT NULL, -- COMMENT '创建时间'
  UNIQUE(`cluster_code`, `app_id`)
);

-- 储存集群的快照，所有在线app及版本
CREATE TABLE IF NOT EXISTS `hc_console_system_cluster_snapshort` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `cluster_code` varchar(50) NOT NULL,
  `info` text, -- COMMENT '集群的app及版本信息',
  `md5` varchar(32), -- COMMENT 'status md5',
  `user` varchar(50) DEFAULT '', -- COMMENT '操作人',
  `gmt_create` datetime NOT NULL -- COMMENT '创建时间'
);
