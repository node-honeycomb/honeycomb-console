import React, {useState} from 'react';
import _ from 'lodash';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import randomstring from 'randomstring';
import {Modal, notification, Spin, Tooltip} from 'antd';

import {clusterApi} from '@api';
import {useRequest} from '@lib/hooks';
import {removeModalDOM} from '@lib/util';

import Machine from '../machine';

import './index.less';

const confirm = Modal.confirm;

const ORIGIN_TOKEN = '***honeycomb-default-token***';
const getTips = (length) => {
  if (!length) {
    return '集群信息';
  }

  return (
    <span>集群信息（<Tooltip title={`当前集群共${length}台机器`}>{length}</Tooltip>）</span>
  );
};

const ClusterStatus = (props) => {
  const {clusterCode, close, clusters} = props;
  const [visible, setVisible] = useState(true);
  const tokenWarnInfo = _.find(clusters, cluster => {
    return cluster.token === ORIGIN_TOKEN;
  });
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

  const changeUnSafeToken = async (data) => {
    const newToken = randomstring.generate(64);
    // call api change server config.admin.token
    let info = _.cloneDeep(data);
    let config = await clusterApi.getAppsConfig('server', {clusterCode: clusterCode});

    config = _.merge(config, {admin: {token: newToken}});

    await clusterApi.setAppConfig('server', {
      clusterCode: clusterCode,
      appConfig: JSON.stringify(config),
      type: 'server',
    });
    info = _.assign({}, info, {isUpdate: true, token: newToken});
    await clusterApi.addCluster(info);
    location.reload();
  };

  const clusterModal = (data) => {
    if (!data) {
      return;
    }
    confirm({
      title: '安全修复',
      content: `检测到${data.name}集群正在使用默认的token，这可能会造成安全隐患，是否自动修复?`,
      onOk() {
        changeUnSafeToken(data);
      },
      onCancel() {},
    });
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
      {
        (!props.serverSecure || tokenWarnInfo) &&
          <div className="warning-wrap">
            {
              !props.serverSecure &&
                <p>
                  Server版本过低，请升级至{window.CONFIG.secureServerVersion}以上，
                  点击查看
                  <a
                    rel="noreferrer"
                    target="_blank"
                    href="https://www.yuque.com/honeycomb/honeycomb/upgrade"
                  >
                    升级文档
                  </a>
                </p>
            }
            {
              tokenWarnInfo &&
              <p>
                集群存在安全隐患
                <span onClick={() => {
                  clusterModal(tokenWarnInfo);
                }} style={{color: '#3366FF', cursor: 'pointer'}}>请修正</span>
              </p>
            }
          </div>
      }
      <div className="cluster-status-content">
        {
          result.success.map(machine => {
            return (
              <Machine
                {...machine}
                key={machine.ip}
                unknowPros={_.find(props.unknowProcesses, unkn => {
                  return unkn.ip === machine.ip;
                })}
                onDeleteUnknowProcess={props.onDeleteUnknowProcess}
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
  unknowProcesses: PropTypes.array,
  onDeleteUnknowProcess: PropTypes.func
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
