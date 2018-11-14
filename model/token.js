'use strict';

const log = require('../common/log');
const db = require('../common/db');
const config = require('../config');
const utils = require('../common/utils');

const QUERY_TOKEN_BY_AKID = `
  SELECT
    *
  FROM
    hc_console_system_user_token
  WHERE
   accessKeyId = ?`;


exports.getTokenByAKID = function (akId, callback) {
    db.query(QUERY_TOKEN_BY_AKID, akId, (err, data) => {
        if(err){
            log.error('query token by akid failed:', err);
            return callback(err);
        }
        if(!data || data.length <= 0) {
            return callback();
        }
        return callback(null, data[0]);
    });
}

const INSERT_TOKEN = `
    insert into hc_console_system_user_token set ?
    `;

exports.genToken = function (username, callback) {
    let accessKeyId = utils.getRandomStr(16);
    let accessKeySecret = utils.getRandomStr(32);
    let token = {
        accessKeyId,
        accessKeySecret,
        username
    };
    db.query(QUERY_TOKEN_BY_AKID, token, (err, data) => {
        if(err){
            log.error('gen token failed:', err);
            return callback(err);
        }
        return callback();
    });
}