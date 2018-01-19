'use strict';

let window = global;

module.exports = {
  getList: {
    url: '/api/v2/links',
    method: 'GET',
    param: {
      workspaceCode: window.workspace,
      entityType: 'link',
      pageSize: 10000
      // entityCodes:["xx", "xx"]
      // entityIds:[1,2,3]
      // keyword: 模糊匹配
      // entityCode和entityName
      // pageNum:
    },
    mock: [
      {name: '收藏', age: 40, id: 1},
      {name: '购买', age: 41, id: 2},
      {name: '喜欢', age: 42, id: 3},
      {name: '浏览', age: 44, id: 4}
    ]
  }
};

