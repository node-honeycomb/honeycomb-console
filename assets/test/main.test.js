'use strict';

const should = require('should');
const redux = require('redux');
const createStore = redux.createStore;
const applyMiddleware = redux.applyMiddleware;
const compose = redux.compose;
const thunk = require('redux-thunk');
const actions = require('./actions');
const rootReducer = actions._rootReducer;
const createLogger = require('redux-logger');

const initialState = {};
const store = createStore(
  rootReducer,
  initialState,
  compose(
    applyMiddleware( thunk
      // , createLogger({logger: console})
    )
  )
);

/*----------------------搭配写法-----------------------*/
// actions分类     syncAction            asyncAction
// actions写法     bigObject(大对象)      class(待支持)
// 异步来源         models

/*----------------------快速写法-----------------------*/
// 1. 异步reducer是函数时,转换为      {success: reducer}

/*-----------------------特性-------------------------*/
// 1. 同步action相互监听
// 2. 异步action相互监听

describe('开始测试', function () {
  it('搭配写法: asyncAction bigObject Models | 特性: 2', function (done) {
    let step = 1;
    let unsubscribe = store.subscribe(function () {
      if (step === 1) {
        step++;
        store.getState().models.object.should.deepEqual({
          fetching: true,
          result: [],
          meta: {}
        });
        store.getState().tag.objectFetched.should.equal(true);
      } else {
        store.getState().models.object.should.deepEqual({"fetching":false,"result":[1,2,3,4,5,6],"meta":{"1":{"name":"用户","age":40,"id":1},"2":{"name":"商品","age":41,"id":2},"3":{"name":"商店","age":42,"id":3},"4":{"name":"动物","age":44,"id":4},"5":{"name":"电影","age":22,"id":5},"6":{"name":"电器","age":21,"id":6}}});

        unsubscribe();
        done();
      }
    });

    store.dispatch(
      actions.models.getObjectList()
    );
  });

  it('搭配写法: asyncAction bigObject | 快速写法: 1', function (done) {
    let step = 1;
    let unsubscribe = store.subscribe(function () {
      if (step === 1) {
        step++;
        store.getState().link.should.deepEqual({
          fetching: false,
          result: [],
          meta: {}
        });
      } else {
        store.getState().link.should.deepEqual({"fetching":false,"result":[1,2,3,4],"meta":{"1":{"name":"收藏","age":40,"id":1},"2":{"name":"购买","age":41,"id":2},"3":{"name":"喜欢","age":42,"id":3},"4":{"name":"浏览","age":44,"id":4}}});

        unsubscribe();
        done();
      }
    });

    store.dispatch(
      actions.link.getList()
    );
  });

  it('搭配写法: syncAction bigObject | 特性: 1', function (done) {
    let unsubscribe = store.subscribe(function () {
      store.getState().link.result.should.deepEqual([1, 2, 3, 4]);
      store.getState().tag.linkSorted.should.equal(true);
      store.getState().object.linkSorted.should.equal(true);

      unsubscribe();
      done();
    });

    store.dispatch(
      actions.link.sort()
    );
  });

  it('class写法支持', function (done) {
    let step = 1;
    let unsubscribe = store.subscribe(function () {
      if (step === 1) {
        step += 1;
      } else {
        store.getState().object.should.deepEqual({"list":[{"name":"用户","age":40,"id":1},{"name":"商品","age":41,"id":2},{"name":"商店","age":42,"id":3},{"name":"动物","age":44,"id":4},{"name":"电影","age":22,"id":5},{"name":"电器","age":21,"id":6}],"linkSorted":true});
        unsubscribe();
        done();
      }
    });

    store.dispatch(
      actions.object.getList()
    );
  });
});

