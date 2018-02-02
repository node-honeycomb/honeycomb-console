CREATE TABLE IF NOT EXISTS `hc_console_system_cluster` (
  `id` INTEGER PRIMARY KEY,
  `name` varchar(128),
  `nickname` varchar(128),
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
  `id` INTEGER PRIMARY KEY,
  `ip` varchar(128) NOT NULL DEFAULT '', -- COMMENT 'worker ip地址',
  `cluster_code` varchar(128) NOT NULL DEFAULT '', -- COMMENT 'worker 所属集群',
  `status` tinyint(4) NOT NULL DEFAULT '1', -- COMMENT '0： 无效， 1：有效',
  `gmt_create` datetime NOT NULL, -- COMMENT '创建时间',
  `gmt_modified` datetime NOT NULL, -- COMMENT '修改时间',
  UNIQUE(`ip`,`cluster_code`)
);

CREATE TABLE IF NOT EXISTS `hc_console_system_user` (
  `id` INTEGER PRIMARY KEY,
  `name` varchar(50), -- COMMENT '用户名',
  `password` varchar(64), -- COMMENT 'password',
  `status` INTEGER NOT NULL DEFAULT '1', -- COMMENT '0： 无效， 1：有效',
  `role` INTEGER NOT NULL DEFAULT '0', -- COMMENT '0： 用户， 1：管理员',
  `gmt_create` datetime NOT NULL, -- COMMENT '创建时间',
  `gmt_modified` datetime NOT NULL, -- COMMENT '修改时间',
  UNIQUE(`name`)
);

CREATE TABLE IF NOT EXISTS `hc_console_system_user_acl` (
  `id` INTEGER PRIMARY KEY,
  `name` varchar(50) DEFAULT NULL COMMENT '用户名',
  `nickname` varchar(50) NOT NULL COMMENT '用户昵称',
  `cluster_id` int(11) unsigned NOT NULL,
  `cluster_code` varchar(50) NOT NULL,
  `cluster_name` varchar(50) NOT NULL,
  `cluster_admin` tinyint(4) NOT NULL DEFAULT '0' COMMENT '0: cluster用户，1: cluster管理员',
  `apps` text CHARACTER SET utf8 COLLATE utf8_bin COMMENT '用户app列表',
  `gmt_create` datetime NOT NULL COMMENT '创建时间',
  `gmt_modified` datetime NOT NULL COMMENT '修改时间'
  UNIQUE(`user`, `cluster_code`)
);
