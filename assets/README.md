## react-starter

> 与redux项目的real-world例子对比

### get start

[传送门](http://gitlab.alibaba-inc.com/DTBoost-Apps/react-starter/wikis/get-start)

### 普通action

不包含异步任务的action

#### [real-world](https://github.com/reactjs/redux/tree/master/examples/real-world/src)一般action

redux + react 架构图

```
┌────────────────┐                ┌────────────────┐
│                │                │                │
│      store     │◀───────────────│     reducers   │
│                │                │                │
└────────────────┘                └────────────────┘
         │                                 ▲        
         │                                 │        
         │                                 │        
         │                                 │        
         │                                 │        
         │                                 │        
         │                                 │        
         │                                 │        
         │                                 │        
         ▼                                 │        
┌────────────────┐                ┌────────────────┐
│                │                │                │
│   containers   │───────────────▶│     actions    │
│                │                │                │
└────────────────┘                └────────────────┘
```

一般写法--以[real-world](https://github.com/reactjs/redux/tree/master/examples/real-world/src)为例

```
.
├── actions                   // actionCreator
├── components
├── containers
├── index.js
├── middleware
├── reducers                  // initStore & reducers
├── routes.js
└── store                     // store
```

增加功能时，需要来回修改action_creator和reducers，如果action的调用逻辑分割在好几层里面，需要修改几个文件才能完成action定义；

#### 我们组织的一般action

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  all in one                                                    │
│                                                                │
│      ┌────────────────┐                ┌────────────────┐      │
│      │                │                │                │      │
│      │      store     │◀───────────────│     reducers   │      │
│      │                │                │                │      │
│      └────────────────┘                └────────────────┘      │
│               │                                 ▲              │
│               │                                 │              │
└───────────────┼─────────────┐                   │              │
                │             │                   │              │
                │             │                   │              │
                │             │                   │              │
                │             │                   │              │
                │             │                   │              │
                │             │                   │              │
                ▼             │                   │              │
       ┌────────────────┐     │          ┌────────────────┐      │
       │                │     │          │                │      │
       │   containers   │─────┼─────────▶│     actions    │      │
       │                │     │          │                │      │
       └────────────────┘     │          └────────────────┘      │
                              │                                  │
                              │                                  │
                              └──────────────────────────────────┘
```

写法

```
.
├── README.md
├── action_route          // initStore & actionCreator & reducer
├── index.jsx
├── models
├── routes.jsx
├── scenes
├── services
└── store                 // store
```

### 异步action

包含异步任务的action，一般为ajax请求，后续支持普通的异步action。

#### [real-world](https://github.com/reactjs/redux/tree/master/examples/real-world/src)的异步action

```
┌────────────────┐                ┌────────────────┐                               
│                │                │                │                               
│      store     │◀───────────────│     reducers   │                               
│                │                │                │                               
└────────────────┘                └────────────────┘                               
         │                                 ▲                                       
         │                                 │                                       
         │                                 │                                       
         │                                 │                                       
         │                                 │                                       
         │                                 │                                       
         │                                 │                                       
         │                                 │                                       
         │                                 │                                       
         ▼                                 │                                       
┌────────────────┐                ┌────────────────┐             ┌────────────────┐
│                │                │                │             │                │
│   containers   │───────────────▶│     actions    │◀───────────▶│   middlewares  │
│                │                │                │             │                │
└────────────────┘                └────────────────┘             └────────────────┘
```

写法

```js
.
├── actions
│   └── index.js              // ajaxActionConfig
├── components
├── containers
├── index.js
├── middleware
│   └── api.js                // httpMiddleWare (ajaxActionCreator)
├── reducers
│   ├── index.js              // reducers
│   └── paginate.js
├── routes.js
└── store

// actions/index.js
export const USER_REQUEST = 'USER_REQUEST'
export const USER_SUCCESS = 'USER_SUCCESS'
export const USER_FAILURE = 'USER_FAILURE'

const fetchUser = login => ({
  [CALL_API]: {
    types: [ USER_REQUEST, USER_SUCCESS, USER_FAILURE ],
    endpoint: `users/${login}`,
    schema: Schemas.USER
  }
})
```

每个action需要定义`CALL_API`这个属性来完成http配置。

#### 我们的异步action

将配置集合在一个文件里，规定Action的名字规范，不需要手动mapping。

```
┌────────────────────────────────────────────────────────────────┐                       
│                                                                │                       
│  all in one                                                    │                       
│                                                                │                       
│     ┌────────────────┐                ┌────────────────┐       │                       
│     │                │                │                │       │                       
│     │      store     │◀───────────────│     reducers   │       │                       
│     │                │                │                │       │                       
│     └────────────────┘                └────────────────┘       │                       
│              │                                 ▲               │                       
│              │                                 │               │                       
└──────────────┼──────────────┐                  │               │                       
               │              │                  │               │                       
               │              │                  │               │                       
               │              │                  │               │                       
               │              │                  │               │                       
               │              │                  │               │                       
               │              │                  │               │                       
               ▼              │                  │               │                       
      ┌────────────────┐      │         ┌────────────────┐       │     ┌────────────────┐
      │                │      │         │                │       │     │                │
      │   containers   │──────┼────────▶│     actions    │◀──────┼────▶│   middlewares  │
      │                │      │         │                │       │     │                │
      └────────────────┘      │         └────────────────┘       │     └────────────────┘
                              │                  ▲               │                       
                              │                  │               │                       
                              └──────────────────┼───────────────┘                       
                                                 │                                       
                                        ┌────────────────┐                               
                                        │                │                               
                                        │    httpConfig  │                               
                                        │                │                               
                                        └────────────────┘                               
```

我们写法

```js
.
├── README.md
├── action_route
│   ├── index.js
│   ├── models.js             // reducers
│   └── utils                 // httpMiddleware (ajaxActionCreator)
├── index.jsx
├── routes.jsx
├── scenes
├── services
│   └── urls.js               // httpConfig (ajaxActionConfig)
└── store

// services/urls.js
module.exports = {
  testApi: {
    url: '/api/v2/objects',
    method: 'GET',
    param: {
      workspaceCode: window.workspace,
      entityType: 'object',
      pageSize: 10000
      // entityCodes:["xx", "xx"]
      // entityIds:[1,2,3]
      // keyword: 模糊匹配
      // entityCode和entityName
      // pageNum:
    },
    mock: [
      {name: '梁朝伟', age: 40, id: 1},
      {name: '刘德华', age: 41, id: 2},
      {name: '郭富城', age: 42, id: 3},
      {name: '黎明', age: 44, id: 4},
      {name: '张学友', age: 22, id: 5}
    ]
  },
  testErrorApi: {
    url: '/api/v2/objects',
    method: 'GET'
  }
};
```

#### dialog usage

```
const Dialog = require('../dialog/index.jsx');

Dialog.createDialog('example_dialog', {content: 'default content'})       // example_dialog has been defined in ./dialog/example_dialog/index.jsx
  .then(data => {
    console.log(data);
  });
```

