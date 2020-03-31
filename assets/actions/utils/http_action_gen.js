'use strict';

const _ = require('lodash');
const ajax = require('./ajax');
const antd = require('antd');
const actionNameGen = require('./action_name_gen');
const React = require('react');
// const ErrorCenter = require('../../scenes/errorCenter/error-center');
module.exports = (urlCfg) => {
  return (param, urlParam, options) => {
    return (dispatch) => {
      let url = urlCfg.url;
      let mock = urlCfg.mock;
      let method = urlCfg.method;
      let headers = Object.assign({}, urlCfg.headers, _.get(options, 'headers') || {});
      if (method !== 'GET') headers = Object.assign({}, window.csrfHeaders || {}, headers);

      let actionName = {
        start: actionNameGen(urlCfg._moduleKey, urlCfg._actionKey, 'start'),
        success: actionNameGen(urlCfg._moduleKey, urlCfg._actionKey, 'success'),
        fail: actionNameGen(urlCfg._moduleKey, urlCfg._actionKey, 'fail')
      };

      urlParam = urlParam || {};
      let grep = /:([\w\.\-\+]+)/g;
      let m = grep.exec(url);
      while (m) {
        url = url.replace(':' + m[1], '' + urlParam[m[1]]);
        m = grep.exec(url);
      }
      param = Object.assign({}, urlCfg.param, param);

      dispatch({type: actionName.start, data: param, urlParam: urlParam, options: options});

      return new Promise((resolve, reject) => {
        if (mock) {
          setTimeout(() => {
            dispatch({type: actionName.success, data: _.cloneDeep(mock), urlParam: urlParam, options: options, param: param, message: ''});
            resolve(_.cloneDeep(mock));
          }, 100);
          return;
        }

        ajax.request(method, url, headers, param, function (error, data) {
          if (error) {
            dispatch({type: actionName.fail, data: error, urlParam: urlParam, options: options, message: error.message});
            let message = _.get(error, 'message', '接口错误, 无错误消息');
            if (message && typeof message === 'object') message = JSON.stringify(message);
            antd.notification.error({
              message: _.get(error, 'code', 'NO_ERROR_CODE'),
              description: message,
              duration: 6
            });
            // ErrorCenter.add({
            //   request: {
            //     url,
            //     method,
            //     headers,
            //     param
            //   },
            //   response: {
            //     code: _.get(error, 'code', 'NO_ERROR_CODE'),
            //     message: message
            //   }
            // });
            return reject(error);
          }
          dispatch({type: actionName.success, data: data.data, urlParam: urlParam, options: options, param: param, message: data.message});
          let _error = _.get(data.data, 'error');
          if (_error && _error.length > 0) {
            let css = {
              display: 'block',
              'word-break': 'break-all'
            };
            let _description = <div>
              {_error.map(d => <div style={{borderBottom: '1px dotted #eee', borderTop: '1px dotted #eee', padding: '5px 0px'}}>
                <span style={css}>ip: {d.ip}</span>
                <span style={css}>code: {d.code}</span>
                <span style={css}>message: {d.message}</span>
              </div>)}
            </div>;
            antd.notification.error({
              message: 'ERROR',
              description: _description,
              duration: null
            });
            // ErrorCenter.add({
            //   request: {
            //     url,
            //     method,
            //     headers,
            //     param
            //   },
            //   response: {
            //     code: 'ERROR',
            //     message: _description
            //   }
            // });
          }
          return resolve(data.data);
        });
      });
    };
  };
};
