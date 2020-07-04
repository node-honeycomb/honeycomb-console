import React, {useState} from 'react';
import _ from 'lodash';
import moment from 'moment';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import WhiteSpace from '@coms/white-space';
import {Tooltip as AntdTooltip, Menu, Dropdown} from 'antd';
import AdminAppIconTip from '@coms/admin-app-icon-tip';
import {DeploymentUnitOutlined, DownOutlined} from '@ant-design/icons';

import {ADMIN_APP_NAME, ADMIN_APP_CODE} from '@lib/consts';
import {PRIMARY_COLOR} from '@lib/color';
import {
  Chart,
  Area,
  Line,
  Tooltip,
} from 'bizcharts';

import './index.less';

const isVersionExcept = (version) => {
  const clusters = version.cluster;

  let expectWorkerNum = 0;

  // eslint-disable-next-line
  for (const cluster of clusters) {
    expectWorkerNum += cluster.expectWorkerNum || 0;
  }

  return !!expectWorkerNum;
};

/**
 * 统计信息
 * 1. 最近发布
 * 2. 总版本数
 * 3. 在线版本数
 * 4. 异常版本数：（1）机器不同步的发布 （2）有错误日志
 * @param {Object[]} versions
 */
const getStat = (versions) => {
  const total = versions.length;
  const online = versions.filter(version => version.isCurrWorking).length;
  const publishAt = moment(_.last(versions).publishAt).format('YYYY-MM-DD HH:mm:ss');
  let exceptNum = 0;

  // eslint-disable-next-line
  for (const version of versions) {
    if (isVersionExcept(version)) {
      exceptNum++;
    }
  }

  return {
    publishAt: publishAt,
    total: total,
    online: online,
    exception: exceptNum
  };
};

const data = [
  {
    time: '2020-07-01 09:30:36', value: 20
  },
  {
    time: '2020-07-02 09:30:36', value: 20
  },
  {
    time: '2020-07-03 09:30:36', value: 30
  },
  {
    time: '2020-07-05 09:30:36', value: 50
  },
  {
    time: '2020-07-06 09:30:36', value: 20
  },
  {
    time: '2020-07-07 09:30:36', value: 10
  },
  {
    time: '2020-07-08 09:30:36', value: 80
  },
  {
    time: '2020-07-09 09:30:36', value: 30
  },
  {
    time: '2020-07-10 09:30:36', value: 100
  },
];

const MENU_KEYS = {
  EXPEND: 'EXPEND',
  CONFIG: 'CONFIG',
  LOG: 'LOG',
};

// 获取菜单
// eslint-disable-next-line
const getMenu = ({onClick}) => {
  return (
    <Menu onClick={({key}) => onClick(key)}>
      <Menu.Item key={MENU_KEYS.EXPEND}>
        <a>
          展开
        </a>
      </Menu.Item>
      <Menu.Item key={MENU_KEYS.CONFIG}>
        <a>
          应用配置
        </a>
      </Menu.Item>
      <Menu.Item key={MENU_KEYS.LOG}>
        <a>
          应用日志
        </a>
      </Menu.Item>
    </Menu>
  );
};


const App = (props) => {
  const {app} = props;
  const {name, versions} = app;
  const {publishAt, total, online, exception} = getStat(versions);
  const isAdminApp = ADMIN_APP_CODE === name;
  const [isActive, setActive] = useState(false);

  const infos = [
    [
      isAdminApp ? (<span>{ADMIN_APP_NAME}<WhiteSpace /><AdminAppIconTip /></span>) : name,
      `创建于${publishAt}`
    ],
    [
      '运行版本',
      `${online}/${total}`
    ],
    [
      '异常数',
      `${exception}`
    ]
  ];

  const charts = [
    [
      '内存（3m）',
      data
    ],
    [
      'cpu（3m）',
      data
    ]
  ];

  return (
    <div
      className={classnames('app', {active: isActive})}
      onClick={() => setActive(!isActive)}
    >
      <div className="app-icon">
        <DeploymentUnitOutlined style={{fontSize: 30}} />
      </div>
      <div className="app-info">
        {
          infos.map(([title, info]) => {
            return (
              <div className="info" key={title}>
                <div className="info-title">{title}</div>
                <div className="info-content">
                  <AntdTooltip title={info} placement="right">
                    {info}
                  </AntdTooltip>
                </div>
              </div>
            );
          })
        }
        {
          charts.map(([title, data]) => {
            return (
              <div
                className="usage-echarts"
                key={title}
              >
                <div className="charts-title">{title}</div>
                <div className="echarts-box">
                  <Chart
                    height={30}
                    width={200}
                    data={data}
                    autoFit
                    pure
                  >
                    <Tooltip shared={false} />
                    <Area
                      position="time*value"
                      color={`l (270) 0:rgba(255, 255, 255, 1) 1:${PRIMARY_COLOR}`}
                    />
                    <Line
                      position="time*value"
                      color={PRIMARY_COLOR}
                    />
                  </Chart>
                </div>
              </div>
            );
          })
        }
        <div className="info">
          <div className="info-title">操作</div>
          <div>
            <a>
            重启
            </a>
            <WhiteSpace />|<WhiteSpace />
            <a>
            重载
            </a>
            <WhiteSpace />|<WhiteSpace />
            <a>
            回滚
            </a>
            <WhiteSpace />|<WhiteSpace />
            <Dropdown overlay={getMenu({onClick: () => setActive(true)})}>
              <a>
                更多<WhiteSpace /><DownOutlined />
              </a>
            </Dropdown>
          </div>
        </div>
      </div>
    </div>
  );
};

App.propTypes = {
  app: PropTypes.shape({
    name: PropTypes.string,
    versions: PropTypes.arrayOf(PropTypes.shape({

    }))
  })
};

export default App;

