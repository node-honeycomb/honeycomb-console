'use strict';

let window = global;

module.exports = {
  getList: {
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
  updateOne: {
    url: '/api/v2/objects',
    method: 'PUT',
    mock: {}
  }
};

