'use strict';

let window = global;

module.exports = {
  getList: {
    url: '/api/v2/tags',
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
      {name: '时间', age: 40, id: 1},
      {name: '地点', age: 41, id: 2}
    ]
  }
};


