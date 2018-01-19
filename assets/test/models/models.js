'use strict';

let window = global;

module.exports = {
  getObjectList: {
    url: '/api/v2/objects',
    method: 'GET',
    param: {
      workspaceCode: window.workspace,
      entityType: 'object',
      pageSize: 10000
    },
    mock: [
      {name: '用户', age: 40, id: 1},
      {name: '商品', age: 41, id: 2},
      {name: '商店', age: 42, id: 3},
      {name: '动物', age: 44, id: 4},
      {name: '电影', age: 22, id: 5},
      {name: '电器', age: 21, id: 6}
    ]
  },
  getLinkList: {
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

