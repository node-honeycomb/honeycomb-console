#!/usr/bin/env node
const db = require('../common/db');

db.ready(() => {
  db.query('delete from hc_console_system_cluster_snapshot', (err) => {
    console.log(err);
    db.query('delete from hc_console_system_cluster_app_pkgs', (err) => {
      console.log(err);
      console.log('done');
    });
  });
});