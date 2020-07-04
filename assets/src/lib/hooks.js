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
