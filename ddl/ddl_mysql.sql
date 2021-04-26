CREATE TABLE IF NOT EXISTS `hc_console_system_cluster` (
  `id` INTEGER AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(128),
  `code` varchar(50) NOT NULL DEFAULT '' UNIQUE,
  `prod` varchar(128) DEFAULT '', -- COMMENT '产品线:'
  `env` varchar(128) DEFAULT '',  -- COMMENT '环境: dev, daily, pre, production'
  `region` varchar(128) DEFAULT '', -- COMMENT '多region: 生产的多套环境'
  `endpoint` text NOT NULL,
  `token` varchar(256) NOT NULL DEFAULT '',
  `monitor` varchar(256) DEFAULT NULL, -- COMMENT '当前集群监控机器人地址，集群异常时会推送到该地址'
  `description` text,
  `status` tinyint(4) NOT NULL DEFAULT '1',
  `gmt_create` datetime NOT NULL,
  `gmt_modified` datetime NOT NULL
);

ALTER TABLE `hc_console_system_cluster` ADD COLUMN  `monitor` varchar(256) DEFAULT NULL;

CREATE TABLE IF NOT EXISTS `hc_console_system_worker` (
  `id` INTEGER AUTO_INCREMENT PRIMARY KEY,
  `ip` varchar(128) NOT NULL DEFAULT '', -- COMMENT 'worker ip地址',
  `cluster_code` varchar(128) NOT NULL DEFAULT '', -- COMMENT 'worker 所属集群',
  `status` tinyint(4) NOT NULL DEFAULT '1', -- COMMENT '0： 无效， 1：有效',
  `gmt_create` datetime NOT NULL, -- COMMENT '创建时间',
  `gmt_modified` datetime NOT NULL, -- COMMENT '修改时间',
  UNIQUE KEY `worker` (`cluster_code`,`ip`)
);

CREATE TABLE IF NOT EXISTS `hc_console_system_worker_tmp` (
  `id` INTEGER AUTO_INCREMENT PRIMARY KEY,
  `ip` varchar(128) NOT NULL DEFAULT '', -- COMMENT 'worker ip地址',
  `cluster_code` varchar(128) NOT NULL DEFAULT '', -- COMMENT 'worker 所属集群',
  `gmt_create` datetime NOT NULL, -- COMMENT '创建时间',
  UNIQUE KEY `worker` (`cluster_code`,`ip`)
);

CREATE TABLE IF NOT EXISTS `hc_console_system_user` (
  `id` INTEGER AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(50) UNIQUE, -- COMMENT '用户名',
  `password` varchar(64), -- COMMENT 'password',
  `status` INTEGER NOT NULL DEFAULT '1', -- COMMENT '0： 无效， 1：有效',
  `role` INTEGER NOT NULL DEFAULT '0', -- COMMENT '0： 用户， 1：管理员',
  `gmt_create` datetime NOT NULL, -- COMMENT '创建时间',
  `gmt_modified` datetime NOT NULL -- COMMENT '修改时间',
);

CREATE TABLE IF NOT EXISTS `hc_console_system_user_acl` (
  `id` INTEGER AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(50) DEFAULT NULL COMMENT '用户名',
  `cluster_id` int(11) unsigned NOT NULL,
  `cluster_code` varchar(50) NOT NULL,
  `cluster_name` varchar(50) NOT NULL,
  `cluster_admin` tinyint(4) NOT NULL DEFAULT '0' COMMENT '0: cluster用户，1: cluster管理员',
  `apps` text CHARACTER SET utf8 COLLATE utf8_bin COMMENT '用户app列表',
  `gmt_create` datetime NOT NULL COMMENT '创建时间',
  `gmt_modified` datetime NOT NULL COMMENT '修改时间',
  UNIQUE KEY `user_cluster` (`name`,`cluster_code`)
);

CREATE TABLE IF NOT EXISTS `hc_console_system_cluster_apps_config` (
  `id` INTEGER AUTO_INCREMENT PRIMARY KEY,
  `cluster_code` varchar(50) NOT NULL DEFAULT '',
  `type` varchar(16) DEFAULT '', 
  `app` varchar(50) COMMENT '应用名， server, common, ',
  `config` text COMMENT '配置文件 json string',
  `version` bigint(11) COMMENT '版本号',
  `user` varchar(50) COMMENT '操作人',
  `gmt_create` datetime NOT NULL COMMENT '创建时间',
  KEY `idx_cluster_code` (`cluster_code`)
);

-- 储存集群app包
CREATE TABLE IF NOT EXISTS `hc_console_system_cluster_app_pkgs` (
  `id` INTEGER AUTO_INCREMENT PRIMARY KEY,
  `cluster_code` varchar(50) NOT NULL DEFAULT '',
  `app_id` varchar(50) COMMENT '应用id',
  `app_name` varchar(50),
  `weight` BIGINT(20),
  `package` longblob COMMENT '应用包',
  `user` varchar(50) COMMENT '操作人',
  `gmt_create` datetime NOT NULL COMMENT '创建时间',
  UNIQUE KEY `cluster_app` (`cluster_code`,`app_id`)
);

-- 储存集群的快照，所有在线app及版本
CREATE TABLE IF NOT EXISTS `hc_console_system_cluster_snapshort` (
  `id` INTEGER AUTO_INCREMENT PRIMARY KEY,
  `cluster_code` varchar(50) NOT NULL,
  `info` text, -- COMMENT '集群的app及版本信息',
  `md5` varchar(32), -- COMMENT 'status md5',
  `user` varchar(50) DEFAULT '', -- COMMENT '操作人',
  `gmt_create` datetime NOT NULL, -- COMMENT '创建时间'
  KEY `idx_cluster_code` (`cluster_code`)
);

-- 字段名和json统一
CREATE TABLE IF NOT EXISTS `hc_console_system_oplog` (
  `id` INTEGER AUTO_INCREMENT PRIMARY KEY,
  `cluster_code` varchar(50) NOT NULL DEFAULT '',
  `client_id` text,
  `op_name` varchar(40) NOT NULL DEFAULT '',
  `op_type` varchar(20) NOT NULL DEFAULT '',
  `op_log_level` varchar(20) NOT NULL DEFAULT '',
  `op_item` varchar(20) NOT NULL DEFAULT '',
  `op_item_id` varchar(255) NOT NULL DEFAULT '', 
  `username` varchar(255) NOT NULL DEFAULT '', 
  `socket` text,
  `detail` text,
  `extends` text,
  `gmt_create` datetime NOT NULL,
  KEY `idx_cluster_code` (`cluster_code`)
);