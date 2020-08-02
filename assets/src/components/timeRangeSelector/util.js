import moment from 'moment';

export const timeUnitAlias2MsMap = {
  s: 1000,
  m: 1000 * 60,
  h: 1000 * 60 * 60,
  d: 1000 * 60 * 60 * 24,
  w: 1000 * 60 * 60 * 24 * 7,
};

export const timeUnitAliasMomentKeyMap = {
  s: 'seconds',
  m: 'minutes',
  h: 'hours',
  d: 'days',
  w: 'weeks',
};

export const timeUnitAlias2CompleteTimeChMap = {
  s: '秒',
  m: '分钟',
  h: '小时',
  d: '天',
  w: '周',
};

/**
 * translate '10s' to '10 秒'
 * @param {string} timeAlias
 * @returns {string}
 */

export function translateTimeAliasToCh(timeAlias) {
  try {
    const [, count, unit] = timeAlias.match(/^(\d+)([a-zA-Z])$/);
    // 10 m

    return `${count} ${timeUnitAlias2CompleteTimeChMap[unit]}`;
  } catch (e) {
    console.error(e);

    return 'invalid timeAlias format';
  }
}

/**
 * translate '10s' to '10 秒'
 * @param {string} timeAlias
 * @returns {from, to}
 */
export function getRecentMomentFromTimeAlias(timeAlias) {
  try {
    const {count, unit} = splitTimeAlias(timeAlias);

    const momentKey = timeUnitAliasMomentKeyMap[unit];
    const from = moment()
      .subtract(Number(count), momentKey)
      .format('YYYY-MM-DD-HH-mm');

    return {
      from,
      to: moment().format('YYYY-MM-DD-HH-mm'),
    };
  } catch (error) {
    return {
      from: moment().format('YYYY-MM-DD-HH-mm'),
      to: moment().format('YYYY-MM-DD-HH-mm'),
    };
  }
}

/**
 * 分隔时间和单位
 * @param {string} timeAlias
 * @returns {string}
 */
export function splitTimeAlias(timeAlias) {
  try {
    const [, count, unit] = timeAlias.match(/^(\d+)([a-zA-Z])$/);

    return {
      count,
      unit,
    };
  } catch (e) {
    return {
      count: 0,
      unit: 's',
    };
  }
}
