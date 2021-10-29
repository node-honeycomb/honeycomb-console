import React, {useState} from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import {Modal, notification, Spin, Tooltip} from 'antd';

import {clusterApi} from '@api';
import {useRequest} from '@lib/hooks';
import {removeModalDOM} from '@lib/util';

import Machine from '../machine';

import './index.less';

const getTips = (length) => {
  if (!length) {
    return '集群信息';
  }

  return (
    <span>集群信息（<Tooltip title={`当前集群共${length}台机器`}>{length}</Tooltip>）</span>
  );
};

const ClusterStatus = (props) => {
  const {clusterCode, close} = props;
  const [visible, setVisible] = useState(true);
  const {result, loading} = useRequest({
    request: () => {
      if (!clusterCode) {
        return null;
      }

      return clusterApi.status(clusterCode);
    },
    defaultValue: {
      success: [],
      error: []
    },
    onError: (err) => {
      notification.error({
        message: '获取集群信息失败',
        description: err.message
      });
    }
  }, [clusterCode]);


  if (!clusterCode) {
    return null;
  }

  const onClose = () => {
    setVisible(false);
    close();
  };

  return (
    <Modal
      visible={visible}
      onOk={onClose}
      onCancel={onClose}
      title={getTips(result.success.length)}
      width="50%"
      style={{
        width: '50%'
      }}
      className="cluster-status-modal"
    >
      {
        loading && <Spin spinning />
      }
      <div className="cluster-status-content">
        {
          result.success.map(machine => {
            return (
              <Machine
                {...machine}
                key={machine.ip}
              />
            );
          })
        }
      </div>
    </Modal>
  );
};

ClusterStatus.propTypes = {
  clusterCode: PropTypes.string,
  close: PropTypes.func,
  clusters: PropTypes.array,
  serverSecure: PropTypes.bool,
};

export default (props) => {
  const div = document.createElement('div');

  document.body.appendChild(div);
  const close = () => removeModalDOM(div);

  ReactDOM.render(
    <ClusterStatus {...props} close={close} />,
    div
  );
};
