import React, {useState, useEffect} from 'react';
import _ from 'lodash';
import moment from 'moment';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import randomstring from 'randomstring';
import {SmileOutlined} from '@ant-design/icons';
import {Modal, Table, message, Tooltip} from 'antd';

import {clusterApi} from '@api';

const confirm = Modal.confirm;

const ORIGIN_TOKEN = '***honeycomb-default-token***';

/**
 *
 * @param {Array} process
 *            - ip {string}
 *            - data {array} 进程
 *                - info {string} 进程信息
 *                - pid {string} 进程号
 * @returns
 */
const flatHcBatchResult = (process) => {
  const output = [];

  if (!process) {
    return output;
  }


  // eslint-disable-next-line
  for (const p of process) {
    // eslint-disable-next-line
    for (const i of p.data) {
      output.push({
        ip: p.ip,
        ...i,
      });
    }
  }

  return output;
};


const ClusterError = (props) => {
  const [v, setV] = useState(true);
  const [unknowProcesses, setUnkownProcesses] = useState([]);
  const [coreDumps, setDumps] = useState([]);
  const {
    serverSecure, onClose,
    currentCluster,
  } = props;

  const tokenWarnInfo = currentCluster.token === ORIGIN_TOKEN;
  const clusterCode = currentCluster.code;

  useEffect(() => {
    setUnkownProcesses(flatHcBatchResult(props.unknowProcesses));
  }, [props.unknowProcesses]);

  useEffect(() => {
    setDumps(flatHcBatchResult(props.coreDumps));
  }, props.coreDumps);


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

  const clusterModal = () => {
    if (!currentCluster) {
      return;
    }

    confirm({
      title: '安全修复',
      content: `检测到${currentCluster.name}集群正在使用默认的token，这可能会造成安全隐患，是否自动修复?`,
      onOk() {
        changeUnSafeToken(currentCluster);
      },
      onCancel() {},
    });
  };


  // ============================= 关闭modal =============================
  const onOk = () => {
    setV(false);

    onClose();
  };

  const handleClose = () => {
    setV(false);
  };

  const onDeleteClusterProcess = async (pid, ip) => {
    try {
      await clusterApi.deleteUnknowProcess(pid, {clusterCode});

      message.success('删除成功！');

      setUnkownProcesses(unknowProcesses.filter(p => {
        return p.ip !== ip && p.pid !== pid;
      }));
    } catch (e) {
      message.error('删除失败！');
    }
  };

  /**
   * 删除 coredump 文件
   */
  const onDelCoredumps = async (file, appId) => {
    try {
      const body = {
        clusterCode,
        files: [file]
      };

      await clusterApi.delCoredump(body);

      setDumps(coreDumps.filter(coredump => {
        return coredump.file !== file && coredump.appId !== appId;
      }));

      message.success('删除成功！');
    } catch (e) {
      message.error('删除失败！');
    }
  };

  // ============================= 未知进程的表头 =============================
  const columns = [
    {
      dataIndex: 'ip',
      title: 'ip',
    },
    {
      dataIndex: 'pid',
      title: '进程号'
    },
    {
      dataIndex: 'info',
      title: '进程信息',
      width: 140,
      render(text) {
        return (
          <Tooltip title={text}>
            <div style={{overflow: 'hidden', whiteSpace: 'nowrap', width: 130}}>{text}</div>
          </Tooltip>
        );
      }
    },
    {
      dataIndex: 'op',
      title: '操作',
      render(_, record) {
        const {pid, ip} = record;

        return (
          <a onClick={() => onDeleteClusterProcess(pid, ip)}>删除</a>
        );
      }
    }
  ];

  // ============================= coredump 的表头 =============================
  const coreDumpscolumns = [
    {
      dataIndex: 'appId',
      title: '应用ID',
    },
    {
      dataIndex: 'file',
      title: '文件名'
    },
    {
      dataIndex: 'mtime',
      title: '修改时间',
      render: (text) => moment(text).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      dataIndex: 'op',
      title: '操作',
      render(_, record) {
        const {file, appId} = record;

        return (
          <a onClick={() => onDelCoredumps(file, appId)}>删除</a>
        );
      }
    }
  ];

  // eslint-disable-next-line
  const isHealth = serverSecure && !tokenWarnInfo && (!unknowProcesses.length) && (!coreDumps.length);

  return (
    <Modal
      visible={v}
      title="集群异常内容"
      onOk={onOk}
      width="50%"
      onCancel={() => {
        onClose();
        handleClose();
      }}
      cancelButtonProps={{style: {display: 'none'}}}
      okText="知道了"
    >
      {
        !serverSecure &&
          <div>
            <h2>版本过低</h2>

            Server版本过低，请升级至 {window.CONFIG.secureServerVersion} 以上，
            点击查看
            <a
              rel="noreferrer"
              target="_blank"
              href="https://www.yuque.com/honeycomb/honeycomb/upgrade"
            >
              升级文档
            </a>
          </div>
      }
      {
        tokenWarnInfo &&
          <div>
            <h2>安全修复</h2>
            集群存在安全隐患，可能会导致机器秘钥泄漏，
            <a
              onClick={() => clusterModal(tokenWarnInfo)}
            >
              点我修正
            </a>
          </div>
      }
      {
        (!!unknowProcesses.length) && (
          <div>
            <h2>未知进程</h2>
            <Table
              columns={columns}
              dataSource={unknowProcesses}
              pagination={false}
            />
          </div>
        )
      }
      {
        (!!coreDumps.length) && (
          <div>
            <h2>Coredump 清理</h2>
            <Table
              columns={coreDumpscolumns}
              dataSource={coreDumps}
              pagination={false}
            />
          </div>
        )
      }
      {
        isHealth && (
          <div style={{color: 'green', textAlign: 'center'}}>
            <SmileOutlined /> 集群健康！
          </div>
        )
      }
    </Modal>
  );
};

ClusterError.propTypes = {
  currentCluster: PropTypes.shape({
    token: PropTypes.string,
    code: PropTypes.string,
    name: PropTypes.string,
  }),
  serverSecure: PropTypes.string,
  onClose: PropTypes.func,
  unknowProcesses: PropTypes.array,
  coreDumps: PropTypes.array
};

export const callClusterError = (options) => {
  const div = document.createElement('div');

  document.body.appendChild(div);

  const onClose = () => {
    setTimeout(() => {
      ReactDOM.unmountComponentAtNode(div);
      div.parentNode && div.parentNode.removeChild(div);
    }, 300);
  };

  ReactDOM.render(
    <ClusterError {...options} onClose={onClose} />,
    div
  );
};

