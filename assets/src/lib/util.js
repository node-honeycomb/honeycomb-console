import _ from 'lodash';

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
