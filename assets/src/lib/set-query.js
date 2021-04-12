import qs from 'qs';
import {routerRedux} from 'dva/router';

import s2q from './search-to-query';

/**
 * 设置 url queryf
 * @param {Object} location location
 * @param {Function} dispatch disptch 方法
 * @param {Object} query query object
 */
const setQuery = (location, dispatch, query) => {
  const currentQuery = s2q(location.search);

  const newQuery = Object.assign(currentQuery, query);

  location.search = '?' + qs.stringify(newQuery);

  dispatch(routerRedux.push(location));
};

export default setQuery;
