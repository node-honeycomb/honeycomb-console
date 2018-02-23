'use strict';

var $ = require('jquery');
try {
  $.ajaxSetup({
    headers: Object.assign({}, window.ajaxHeader)
  });
} catch (error) {
  // ignore error
}

exports.request = function request(method, url, headers, data, callback) {
  if (!callback && typeof data === 'function') {
    callback = data;
    data = null;
  }

  // data如果包含函数的话,会在控制台报错,一般不会出现;

  var setting = {
    url: window.prefix + url,
    data: data,
    type: method,
    headers: headers,
    dataType: 'json',
    error: function (xhr, textStatus, error) {
      if (xhr.responseJSON) {
        return callback && callback(xhr.responseJSON.error || xhr.responseJSON, []);
      }
      if (textStatus) {
        return callback && callback(textStatus, []);
      }
      callback && callback(null, []);
    },
    success: function (data) {
      if (data.code && data.code !== 'SUCCESS') {
        return callback && callback(data, []);
      }
      callback && callback(null, data);
    }
  };
  if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
    setting.data = JSON.stringify(setting.data);
    setting.contentType = 'application/json; charset=utf-8';
  }
  return $.ajax(setting);
};
