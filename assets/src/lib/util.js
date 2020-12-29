import _ from 'lodash';
import ReactDOM from 'react-dom';
import {APP_STATUS} from './consts';

export const tryParse = (str, defaultValue = {}) => {
  try {
    return JSON.parse(str);
  } catch (e) {
    return defaultValue;
  }
};

/*
 * params: arr
 * return: '["*","*"...]'
 */
export const tryArrToStr = (arr) => {
  try {
    if (!Array.isArray(arr)) throw new Error(false);
    const result = [];

    arr.forEach((e) => {
      result.push(`"${e}"`);
    });

    return `[${result.join(',')}]`;
  } catch (error) {
    return [];
  }
};

export const tryArrToLineBreakStr = (arr) => {
  try {
    if (!Array.isArray(arr)) throw new Error(false);

    return arr.map((e) => e).join('\n');
  } catch (error) {
    return [];
  }
};

/** params
 * @param {String} str
 * @returns {Array} [{time:'', value:''}]
 */
export const tryUsageStrToArr = (str) => {
  try {
    if (!_.isString(str)) throw new Error(false);

    const item = _.split(str, `;`);
    const r = [];

    item.forEach((e) => {
      const val = _.split(e, `,`);

      r.push({
        time: `${val[0]}`,
        value: Number(val[1]),
      });
    });

    return r;
  } catch (error) {
    return [];
  }
};

export const getStatus = (versionApp) => {
  const {cluster} = versionApp;

  return cluster.map(c => c.status);
};

// 判断一个 version 的版本是否相同
export const isSameStatus = (versionApp) => {
  return _.uniq(getStatus(versionApp)).length === 1;
};

// 判断是否有应用在loading当中
export const isAppLoading = (versionApp) => {
  if (!versionApp) {
    return false;
  }

  return getStatus(versionApp).includes(APP_STATUS.RELOAD) ||
   getStatus(versionApp).includes(APP_STATUS.RELOADED);
};

/**
 * 清除函数调用所添加的 Modal 元素。
 * @param {element} node dom
 */
export const removeModalDOM = (node) => {
  const unmountResult = ReactDOM.unmountComponentAtNode(node);

  if (unmountResult && node.parentNode) {
    setTimeout(() => {
      node.parentNode.removeChild(node);
    }, 800);
  }
};
