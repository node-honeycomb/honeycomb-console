import qs from 'qs';

/**
 * search 转 query
 * @param {String} search
 */
export default (search) => {
  if (search.startsWith('?')) {
    const _search = search.replace(/^\?/, '');

    return qs.parse(_search);
  }

  return qs.parse(search);
};
