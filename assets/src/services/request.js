import qs from 'qs';
import _ from 'lodash';
import axios from 'axios';

const prefix = window.CONFIG.prefix;
const csrfToken = window.CONFIG.csrfToken;
const headers = {
  'x-csrf-token': csrfToken,
};

// 公共请求响应体
const instance = axios.create({
  baseURL: `${prefix}`,
  timeout: 1000 * 60,
  headers: {
    'Content-Type': 'application/json',
    ...headers,
  },
  paramsSerializer: function(params) {
    return qs.stringify(params, { arrayFormat: 'repeat' });
  },
  transformResponse: [
    (response) => {
      try {
        const result = JSON.parse(response);

        if (result.code !== 'SUCCESS') {
          throw error(result);
        }

        return result;
      } catch (e) {
        console.log(e);
        throw e;
      }
    },
  ],
});

class Request {
  constructor() {
    this._init();
  }

  // 处理共用 query
  procConfig = (config) => {
    if (!config) {
      config = {};
    }

    // 不需要公共query
    if (config.without) {
      return config;
    }

    return config;
  };

  _init = () => {
    // Provide aliases for supported request methods
    ['delete', 'get', 'head', 'options'].forEach((method) => {
      this[method] = (url, config) => {
        config = this.procConfig(config);

        return this.request(
          _.merge({}, config, {
            url: url,
            method: method,
          })
        );
      };
    });

    ['post', 'put', 'patch'].forEach((method) => {
      this[method] = (url, data, config) => {
        config = this.procConfig(config);
        return this.request(
          _.merge({}, config, {
            url,
            method,
            data,
          })
        );
      };
    });
  };

  request = (config) => {
    return instance.request(config).then(then);
  };
}

// 公共的 then 函数
export const then = (response) => {
  return _.get(response, 'data.data');
};

// 自定义错误
export const error = ({ code, message, ...rest }) => {
  const e = new Error(message);

  e.code = code;
  Object.assign(e, rest);

  return e;
};

/**
 * 看 axios 的官方文档: https://web.npm.alibaba-inc.com/package/axios
 * get, delete, head, options:
 *  - 设置query
 *  request.get('http://www.baidu.com', {params: {a: 'b'}})
 *
 * post, put, patch:
 *  - 设置query
 *  request.post('http://www.baidu.com', {}, {params: {a: 'b'}});
 *
 *  - 设置body
 *  request.post('http://www.baidu.com', {a: 'b'});
 *
 *  - POST设置body&query
 *  request.post('http://www.baidu.com', {a: 'b'}， {params: {query1: "abc"}});
 */
export default new Request();
