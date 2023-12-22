CREATE TABLE IF NOT EXISTS "hc_console_system_cluster" (
  "id" INT AUTO_INCREMENT ,
  "name" VARCHAR(128),
  "code" VARCHAR(50) NOT NULL  UNIQUE  DEFAULT '',
  "prod" VARCHAR(128) DEFAULT '',
  "env" VARCHAR(128) DEFAULT '',
  "region" VARCHAR(128) DEFAULT '',
  "endpoint" TEXT NOT NULL ,
  "token" VARCHAR(256) NOT NULL  DEFAULT '',
  "monitor" VARCHAR(256) DEFAULT NULL,
  "description" TEXT,
  "status" INT NOT NULL  DEFAULT '1',
  "gmt_create" TIMESTAMP NOT NULL ,
  "gmt_modified" TIMESTAMP NOT NULL ,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS "hc_console_system_worker" (
  "id" INT AUTO_INCREMENT ,
  "ip" VARCHAR(128) NOT NULL  DEFAULT '',
  "cluster_code" VARCHAR(128) NOT NULL  DEFAULT '',
  "status" INT NOT NULL  DEFAULT '1',
  "gmt_create" TIMESTAMP NOT NULL ,
  "gmt_modified" TIMESTAMP NOT NULL ,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS "hc_console_system_worker_tmp" (
  "id" INT AUTO_INCREMENT ,
  "ip" VARCHAR(128) NOT NULL  DEFAULT '',
  "cluster_code" VARCHAR(128) NOT NULL  DEFAULT '',
  "gmt_create" TIMESTAMP NOT NULL ,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS "hc_console_system_user" (
  "id" INT AUTO_INCREMENT ,
  "name" VARCHAR(50) UNIQUE ,
  "password" VARCHAR(64),
  "status" INT NOT NULL  DEFAULT '1',
  "role" INT NOT NULL  DEFAULT '0',
  "gmt_create" TIMESTAMP NOT NULL ,
  "gmt_modified" TIMESTAMP NOT NULL ,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS "hc_console_system_user_acl" (
  "id" INT AUTO_INCREMENT ,
  "name" VARCHAR(50) DEFAULT NULL,
  "cluster_id" INT NOT NULL ,
  "cluster_code" VARCHAR(50) NOT NULL ,
  "cluster_name" VARCHAR(50) NOT NULL ,
  "cluster_admin" INT NOT NULL  DEFAULT '0',
  "apps" TEXT,
  "gmt_create" TIMESTAMP NOT NULL ,
  "gmt_modified" TIMESTAMP NOT NULL ,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS "hc_console_system_cluster_apps_config" (
  "id" INT AUTO_INCREMENT ,
  "cluster_code" VARCHAR(50) NOT NULL  DEFAULT '',
  "type" VARCHAR(16) DEFAULT '',
  "app" VARCHAR(50),
  "config" TEXT,
  "version" BIGINT,
  "user" VARCHAR(50),
  "gmt_create" TIMESTAMP NOT NULL ,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS "hc_console_system_cluster_app_pkgs" (
  "id" INT AUTO_INCREMENT ,
  "cluster_code" VARCHAR(50) NOT NULL  DEFAULT '',
  "app_id" VARCHAR(50),
  "app_name" VARCHAR(50),
  "weight" BIGINT,
  "package" BLOB,
  "user" VARCHAR(50),
  "gmt_create" TIMESTAMP NOT NULL ,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS "hc_console_system_cluster_snapshort" (
  "id" INT AUTO_INCREMENT ,
  "cluster_code" VARCHAR(50) NOT NULL ,
  "info" TEXT,
  "md5" VARCHAR(32),
  "user" VARCHAR(50) DEFAULT '',
  "gmt_create" TIMESTAMP NOT NULL ,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS "hc_console_system_oplog" (
  "id" INT AUTO_INCREMENT ,
  "cluster_code" VARCHAR(50) NOT NULL  DEFAULT '',
  "client_id" TEXT,
  "op_name" VARCHAR(40) NOT NULL  DEFAULT '',
  "op_type" VARCHAR(20) NOT NULL  DEFAULT '',
  "op_log_level" VARCHAR(20) NOT NULL  DEFAULT '',
  "op_item" VARCHAR(20) NOT NULL  DEFAULT '',
  "op_item_id" VARCHAR(255) NOT NULL  DEFAULT '',
  "username" VARCHAR(255) NOT NULL  DEFAULT '',
  "socket" TEXT,
  "detail" TEXT,
  "extends" VARCHAR,
  "gmt_create" TIMESTAMP NOT NULL ,
  PRIMARY KEY (id)
);

create or replace UNIQUE index hc_console_system_cluster_app_pkgs_cluster_app on "hc_console_system_cluster_app_pkgs" (cluster_code,app_id);

create or replace index hc_console_system_cluster_apps_config_idx_cluster_code on "hc_console_system_cluster_apps_config" (cluster_code);

create or replace index hc_console_system_cluster_snapshort_idx_cluster_code on "hc_console_system_cluster_snapshort" (cluster_code);

create or replace index hc_console_system_oplog_idx_cluster_code on "hc_console_system_oplog" (cluster_code);

create or replace UNIQUE index hc_console_system_user_acl_user_cluster on "hc_console_system_user_acl" (name,cluster_code);

create or replace UNIQUE index hc_console_system_worker_worker on "hc_console_system_worker" (cluster_code,ip);

create or replace UNIQUE index hc_console_system_worker_tmp_worker on "hc_console_system_worker_tmp" (cluster_code,ip);