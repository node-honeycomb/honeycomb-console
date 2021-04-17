import React from 'react';
import moment from 'moment';
import {Tooltip} from 'antd';

import {SYS_CPU_TIPS} from '@lib/consts';

import './index.less';

const before = moment().format('HH:00:00');

const titles = [
  {
    name: '应用名',
    width: '150px'
  },
  {
    name: '版本号',
    width: '100px'
  },
  {
    name: '处理单元',
    width: '60px',
    info: '用于标识当前每台机器上的进程数'
  },
  {
    name: '发布时间',
    width: '200px'
  },
  {
    name: '状态',
    width: '120px'
  },
  {
    name: '平均内存',
    width: '90px',
    info: `获取从${before}到现在的平均内存`
  },
  {
    name: '平均cpu',
    width: '90px',
    info: <span>获取从{before}到现在的平均CPU负载，{SYS_CPU_TIPS}</span>
  }
];

// 简洁模式下的表头
// TODO: 加一个固定的Affix
const SimpleTitle = () => {
  return (
    <div className="simple-title">
      {
        titles.map(item => {
          return (
            <Tooltip
              title={item.info}
              key={item.name}
            >
              <span
                key={item.name}
                style={{
                  width: item.width
                }}
              >
                {item.name}
              </span>
            </Tooltip>
          );
        })
      }
    </div>
  );
};

export default SimpleTitle;
