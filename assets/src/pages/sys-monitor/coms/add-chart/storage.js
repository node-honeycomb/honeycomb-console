import _ from 'lodash';
import moment from 'moment';
import {message} from 'antd';

const KEY = 'hc-sys-monitor-card';
const colors = [
  '#87D2FF', '#15AD31', '#FA8C15',
  '#E62412', '#329dce', '#329dc5'
];
const callbacks = [];

export const add = () => {
  const cards = list();

  if (cards.length >= 6) {
    message.warn(`最多允许创建6张监控报表`);

    return;
  }

  let key = 1;

  if (cards.length !== 0) {
    key = _.max(cards.map(c => c.key)) + 1;
  }

  cards.push({
    key: key,
    createdAt: moment().format('YYYY-MM-DD HH:mm:ss'),
    apps: [],
    color: colors[cards.length]
  });

  save(cards);
};

export const update = (key, apps) => {
  const cards = list();

  cards.forEach(card => {
    if (card.key !== key) {
      return;
    }

    card.apps = apps;
  });

  save(cards);
};

export const detroy = (key) => {
  let cards = list();

  cards = cards.filter(card => card.key !== key);

  save(cards);
};

export const list = () => {
  const cnt = localStorage.getItem(KEY);

  try {
    return JSON.parse(cnt) || [];
  } catch (e) {
    return [];
  }
};

export const save = (cfg) => {
  localStorage[KEY] = JSON.stringify(cfg);
  callAllCb();
};

export const on = (fn) => {
  if (typeof fn !== 'function') {
    return;
  }

  callbacks.push(fn);
};

export const callAllCb = () => {
  callbacks.forEach(fn => {
    try {
      fn();
    } catch (e) {
      console.error(e);
    }
  });
};
