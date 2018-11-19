const crypto = require('crypto');
const log = require('../common/log');
const TokenModel = require('../model/token');

function userVerify(req, userSign, accessKeySecret) {
    let headers   = req.headers;
    let date      = headers.date;
    let method = req.method;
    let url = req.originalUrl || req.url;
    let accept = headers.accept;
    let contentType = headers['content-type'];
    let stringToSign;
  
    if (['POST', 'PUT', 'PATCH'].indexOf(method) >= 0) {
      let contentMd5 = req._contentMd5;
      stringToSign = `${method}\n${accept}\n${contentMd5}\n${contentType}\n${date}\n${url}`;
    } else {
      // 没有content也需要用\n补齐
      stringToSign = `${method}\n${accept}\n\n${contentType}\n${date}\n${url}`;
    }
    let realSign = crypto.createHmac('sha1', accessKeySecret).update(stringToSign, 'utf8').digest('base64');
  
    if (userSign !== realSign) {
      let msg = `check_sign_error, signstr: ${stringToSign}`;
      let err = new Error(msg);
      log.error('toSignStr', stringToSign);
      log.error(msg + `client_sign: ${userSign}, server_sign: ${realSign}, accessKeyId: ${accessKeySecret}`);
      err.status = 401;
      err.code = 'check_sign_error';
      err.message = msg;
      return err;
    }
  }


/**
header Authorization -> "dtoobst-proxy " + ak_id + ":" + signature;
 */
module.exports = function(req, res, next){
      let authHeader = req.headers.authorization;
      if(!authHeader){
          return next();
      }
      let sign = authHeader.split(' ')[1]
      if(!sign){
          return next();
      }
      let [id, signStr] = sign.split(':');
      if(!id || !signStr){
          return next();
      }
      TokenModel.getTokenByAKID(id,(err, token) => {
          if(err) return next(err);
          if(!token) return next(new Error('token not exist'));
          err = userVerify(req, signStr, token.accessKeySecret)
          if (err) {
            return next(err)
          }
          req.session.username = token.username;
          next();
      });
  }