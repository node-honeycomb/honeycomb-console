import {useEffect, useState} from 'react';
import _ from 'lodash';

export const useRequest = ({request, onError, defaultValue}, deps) => {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(defaultValue);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const result = await request();

        return setResult(result || defaultValue);
      } catch (e) {
        _.isFunction(onError) && onError(e);
        setError(e);
      } finally {
        setLoading(false);
      }
    })();

    return () => {

    };
  }, deps);

  return {loading, result, error};
};

/**
 * 搜索用hooks
 * @param {Object} option
 * @param {Array} option.data
 * @param {String[]} option.keys 对应检索关键词
 */
export const useSearch = ({
  data = [],
  keys = []
}) => {
  const [keyword, setKeyword] = useState('');
  const [dataSource, setDataSource] = useState(data);

  const onSearch = (keyword) => {
    setKeyword(keyword);
  };

  useEffect(() => {
    if (!keyword) {
      setDataSource(data);

      return;
    }

    const ds = _.filter(data, (item) => {
      let matched = false;

      keys.forEach(key => {
        if (matched) {
          return;
        }

        if (Array.isArray(item[key])) {
          item[key].forEach(item => {
            if (matched) {
              return;
            }
            if (item.includes(keyword)) {
              matched = true;

              return;
            }
          });
        }

        if (item[key].includes(keyword)) {
          matched = true;
        }
      });

      return matched;
    });

    setDataSource(ds);
  }, [data, keyword]);

  return {
    onSearch,
    dataSource,
  };
};
