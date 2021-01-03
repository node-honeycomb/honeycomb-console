import React from 'react';
import PropTypes from 'prop-types';
import {Menu, Dropdown, Modal} from 'antd';

import {APP_STATUS} from '@lib/consts';
import WhiteSpace from '@coms/white-space';
import {DownOutlined} from '@ant-design/icons';

const MENU_KEYS = {
  EXPEND: 'EXPEND',
  CONFIG: 'CONFIG',
  LOG: 'LOG',
};

// 对外透出的动作
export const MENU_ACTIONS = {
  ...MENU_KEYS,
  RESTART: 'RESTART',   // 重启APP
  RELOAD: 'RELOAD',     // 重载APP
  START: 'START',       // 启动APP
  STOP: 'STOP',         // 停止APP
  DELETE: 'DELETE',     // 删除APP
  ROLLBACK: 'ROLLBACK',     // 删除APP
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

const AppOp = (props) => {
  const {
    status, showMore,
    appName, onClick = () => null
  } = props;

  const onItemClick = (key, actionName = '操作') => {
    return (e) => {
      e.stopPropagation();

      Modal.confirm({
        title: `确定${actionName}应用「${appName}」?`,
        content: '请谨慎操作，点击确定后将立即生效！',
        onOk: async () => {
          await onClick(key);
        },
        cancelText: '隐藏'
      });
    };
  };

  const more = () => {
    if (!showMore) {
      return null;
    }

    return (
      <span onClick={e => e.stopPropagation()}>
        <WhiteSpace />|<WhiteSpace />
        <Dropdown overlay={getMenu({onClick})}>
          <a>
            更多<WhiteSpace /><DownOutlined />
          </a>
        </Dropdown>
      </span>
    );
  };

  if (status.includes(APP_STATUS.ONLINE)) {
    return (
      <div>
        <a onClick={onItemClick(MENU_ACTIONS.RELOAD, '重启')}>
          重启
        </a>
        <WhiteSpace />|<WhiteSpace />
        {
          showMore ? (
            <a onClick={onItemClick(MENU_ACTIONS.ROLLBACK, '回滚')}>
              回滚
            </a>
          ) : (
            <a onClick={onItemClick(MENU_ACTIONS.STOP, '停止')}>
              停止
            </a>
          )
        }
        {more()}
      </div>
    );
  }

  return (
    <div>
      <a onClick={onItemClick(MENU_ACTIONS.START, '启动')}>
        启动
      </a>
      <WhiteSpace />|<WhiteSpace />
      <a onClick={onItemClick(MENU_ACTIONS.DELETE, '删除')}>
        删除
      </a>
      {more()}
    </div>
  );
};

AppOp.propTypes = {
  status: PropTypes.string,
  showMore: PropTypes.boolean,
  onClick: PropTypes.func,
  appName: PropTypes.string
};

export default AppOp;
