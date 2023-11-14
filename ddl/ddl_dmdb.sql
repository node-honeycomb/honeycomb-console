CREATE TABLE IF NOT EXISTS "hc_console_system_cluster" (
  "id" INT  AUTO_INCREMENT ,
  "name" VARCHAR(128) ,
  "code" VARCHAR(50) NOT NULL ,
  "prod" VARCHAR(128) ,
  "env" VARCHAR(128) ,
  "region" VARCHAR(128) ,
  "endpoint" TEXT NOT NULL ,
  "token" VARCHAR(256) NOT NULL ,
  "monitor" VARCHAR(256) ,
  "description" TEXT ,
  "status" INT NOT NULL ,
  "gmt_create" TIMESTAMP NOT NULL ,
  "gmt_modified" TIMESTAMP NOT NULL ,
PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS "hc_console_system_worker" (
  "id" INT  AUTO_INCREMENT ,
  "ip" VARCHAR(128) NOT NULL ,
  "cluster_code" VARCHAR(128) NOT NULL ,
  "status" INT NOT NULL ,
  "gmt_create" TIMESTAMP NOT NULL ,
  "gmt_modified" TIMESTAMP NOT NULL ,
PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS "hc_console_system_worker_tmp" (
  "id" INT  AUTO_INCREMENT ,
  "ip" VARCHAR(128) NOT NULL ,
  "cluster_code" VARCHAR(128) NOT NULL ,
  "gmt_create" TIMESTAMP NOT NULL ,
PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS "hc_console_system_user" (
  "id" INT  AUTO_INCREMENT ,
  "name" VARCHAR(50) ,
  "password" VARCHAR(64) ,
  "status" INT NOT NULL ,
  "role" INT NOT NULL ,
  "gmt_create" TIMESTAMP NOT NULL ,
  "gmt_modified" TIMESTAMP NOT NULL ,
PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS "hc_console_system_user_acl" (
  "id" INT  AUTO_INCREMENT ,
  "name" VARCHAR(50) ,
  "cluster_id" INT NOT NULL ,
  "cluster_code" VARCHAR(50) NOT NULL ,
  "cluster_name" VARCHAR(50) NOT NULL ,
  "cluster_admin" INT NOT NULL ,
  "apps" TEXT ,
  "gmt_create" TIMESTAMP NOT NULL ,
  "gmt_modified" TIMESTAMP NOT NULL ,
PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS "hc_console_system_cluster_apps_config" (
  "id" INT  AUTO_INCREMENT ,
  "cluster_code" VARCHAR(50) NOT NULL ,
  "type" VARCHAR(16) ,
  "app" VARCHAR(50) ,
  "config" TEXT ,
  "version" BIGINT ,
  "user" VARCHAR(50) ,
  "gmt_create" TIMESTAMP NOT NULL ,
PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS "hc_console_system_cluster_app_pkgs" (
  "id" INT  AUTO_INCREMENT ,
  "cluster_code" VARCHAR(50) NOT NULL ,
  "app_id" VARCHAR(50) ,
  "app_name" VARCHAR(50) ,
  "weight" BIGINT ,
  "package" BLOB ,
  "user" VARCHAR(50) ,
  "gmt_create" TIMESTAMP NOT NULL ,
PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS "hc_console_system_cluster_snapshort" (
  "id" INT  AUTO_INCREMENT ,
  "cluster_code" VARCHAR(50) NOT NULL ,
  "info" TEXT ,
  "md5" VARCHAR(32) ,
  "user" VARCHAR(50) ,
  "gmt_create" TIMESTAMP NOT NULL ,
PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS "hc_console_system_oplog" (
  "id" INT  AUTO_INCREMENT ,
  "cluster_code" VARCHAR(50) NOT NULL ,
  "client_id" TEXT ,
  "op_name" VARCHAR(40) NOT NULL ,
  "op_type" VARCHAR(20) NOT NULL ,
  "op_log_level" VARCHAR(20) NOT NULL ,
  "op_item" VARCHAR(20) NOT NULL ,
  "op_item_id" VARCHAR(255) NOT NULL ,
  "username" VARCHAR(255) NOT NULL ,
  "socket" TEXT ,
  "detail" TEXT ,
  "extends" VARCHAR ,
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