CREATE TABLE IF NOT EXISTS `hc_console_system_cluster` (
  `id` INTEGER AUTO_INCREMENT PRIMARY KEY,
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
  `id` INTEGER AUTO_INCREMENT PRIMARY KEY,
  `ip` varchar(128) NOT NULL DEFAULT '' UNIQUE, -- COMMENT 'worker ip地址',
  `cluster_code` varchar(128) NOT NULL DEFAULT '', -- COMMENT 'worker 所属集群',
  `status` tinyint(4) NOT NULL DEFAULT '1', -- COMMENT '0： 无效， 1：有效',
  `gmt_create` datetime NOT NULL, -- COMMENT '创建时间',
  `gmt_modified` datetime NOT NULL -- COMMENT '修改时间',
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
  `user` varchar(50) UNIQUE, -- COMMENT '用户名',
  `cluster_code` varchar(50) NOT NULL,
  `role` INTEGER NOT NULL DEFAULT 0, -- COMMENT '0: cluster用户，1: cluster管理员 2: cluster 创建者',
  `apps` text, -- COMMENT '用户app列表',
  `gmt_create` datetime NOT NULL, -- COMMENT '创建时间',
  `gmt_modified` datetime NOT NULL -- COMMENT '修改时间',
);
