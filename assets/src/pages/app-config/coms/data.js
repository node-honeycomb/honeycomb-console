import Mock from 'mockjs';

const {Random} = Mock;
const list = Mock.mock({
  'list|1-10': [{
    'id|+1': 1,
    name: () => Random.cword(3, 5)
  }]
});

const getData = new Promise((res) => {
  setTimeout(() => {
    res(list);
  }, 1000);
});

export default {getData};
