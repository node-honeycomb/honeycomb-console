import React, {useState} from 'react';
import {Divider, Modal} from 'antd';
import PropTypes from 'prop-types';
import {LoadingOutlined} from '@ant-design/icons';

import {MENU_ACTIONS} from '../app/app-op';

const AButton = (props) => {
  // eslint-disable-next-line
  if (props.loading === "true") {
    return (
      <span className="loading-btn">
        <LoadingOutlined />
        &nbsp;
        {/* eslint-disable-next-line */}
        {props.children}
      </span>
    );
  }

  return (
    <span>
      <a {...props} />
    </span>
  );
};


const VersionOp = (props) => {
  const {status, onAction, appId} = props;
  const [loading, setLoading] = useState(false);

  const onClick = async (action, actionName) => {
    if (action === MENU_ACTIONS.START) {
      try {
        setLoading(action);

        return await onAction(action);
      } finally {
        setLoading(false);
      }
    }

    Modal.confirm({
      title: '请确认',
      content: `确定要对${appId}执行${actionName}吗？`,
      onOk: () => {
        setLoading(action);

        onAction(action)
          .finally(() => {
            setLoading(false);
          });
      }
    });
  };

  if (status.includes('offline')) {
    return (
      <span className="version-op">
        <AButton
          className="delete"
          onClick={() => onClick(MENU_ACTIONS.DELETE, '删除')}
          loading={loading === MENU_ACTIONS.DELETE ? "true" : "false"}
        >
          删除
        </AButton>
        <Divider type="vertical" />
        <AButton
          color="blue"
          onClick={() => onClick(MENU_ACTIONS.START, '启动')}
          loading={loading === MENU_ACTIONS.START ? "true": "false"}
        >
          启动
        </AButton>
      </span>
    );
  }

  return (
    <span className="version-op">
      <AButton
        className="stop"
        onClick={() => onClick(MENU_ACTIONS.STOP, '停止')}
        loading={loading === MENU_ACTIONS.STOP}
      >
        停止
      </AButton>
      <Divider type="vertical" />
      <AButton
        color="blue"
        onClick={() => onClick(MENU_ACTIONS.RELOAD, '重载')}
        loading={loading === MENU_ACTIONS.RELOAD}
      >
        重载
      </AButton>
    </span>
  );
};

VersionOp.propTypes = {
  status: PropTypes.array,
  onAction: PropTypes.func,
  appId: PropTypes.string
};


export default VersionOp;
