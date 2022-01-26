import React, {useState, useEffect, useCallback} from 'react';
import _ from 'lodash';
import {connect} from 'dva';
import PropTypes from 'prop-types';
import {
  Table, Button, Divider, Modal,
  message, Tag
} from 'antd';

import {clusterApi} from '@api';
import {useSearch} from '@lib/hooks';
import {openSnapshot} from '@coms/snapshot';
import CommonTitle from '@coms/common-title';
import notification from '@coms/notification';

import clusterUpset from './cluster-upset';

const ENV = {
  prod: <Tag color="green">生产环境</Tag>,
  dev: <Tag>开发环境</Tag>,
  pre: <Tag color="geekblue">预发环境</Tag>
};

const UserManager = (props) => {
  const [fixing, setFixing] = useState(false);
  const [clusterList, setClusterList] = useState([]);

  const getCluster = async () => {
    const {dispatch} = props;

    try {
      const clusters = await dispatch({type: 'global/getCluster'});
      const dataSource = _.map(clusters, (value, key) => {
        return _.assign({}, value, {code: key}, {key: key});
      });

      setClusterList(dataSource);
    } catch (err) {
      notification.error({
        message: '请求集群列表失败',
        description: err.message,
      });
    }
  };

  const {onSearch, dataSource} = useSearch({
    data: clusterList,
    keys: [
      'name', 'code', 'endpoint', 'ips'
    ]
  });

  useEffect(() => {
    getCluster();
  }, []);

  const onAddCluster = useCallback(async () => {
    clusterUpset({getCluster});
  });

  const handleEdit = (row) => {
    clusterUpset({row, getCluster});
  };

  const handleConfirm = (row) => {
    const code = _.get(row, 'code');

    Modal.confirm({
      title: `确定要删除该集群吗？`,
      content: `无法复原，请谨慎操作`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await clusterApi.deleteCluster(code);
          getCluster();
          message.success('集群删除成功');
        } catch (error) {
          notification.error({
            message: '集群删除失败',
            description: error.message,
          });
        }
      }
    });
  };

  /**
   * 列出当前集群的快照
   */
  const onClusterSnapshot = (cluster) => {
    const clusterCode = cluster.code;

    openSnapshot(clusterCode);
  };

  const cols = () => [
    {
      title: '集群名称',
      dataIndex: 'name',
    },
    {
      title: '集群code',
      dataIndex: 'code',
    },
    {
      title: 'endpoint',
      dataIndex: 'endpoint',
    },
    {
      title: 'ip列表',
      dataIndex: 'ips',
      render(row) {
        return <span>
          {
            row.map(ip => {
              return (
                <div key={ip}>{ip}</div>
              );
            })
          }
        </span>;
      },
    },
    {
      title: '集群环境',
      dataIndex: 'env',
      render: (row) => {
        return _.get(ENV, row);
      },
    },
    {
      title: '操作',
      // eslint-disable-next-line react/display-name
      render: (row) => {
        const style = {padding: '0px'};

        return (
          <div style={{whiteSpace: 'nowrap'}}>
            <Button style={style} type="link" onClick={() => handleEdit(row)}>
              编辑
            </Button>
            <Divider type="vertical" />
            <Button style={style} type="link" onClick={() => handleConfirm(row)}>
              删除
            </Button>
            <Divider type="vertical" />
            <Button
              style={style}
              type="link"
              onClick={() => onClusterSnapshot(row)}
            >
              快照
            </Button>
            <Divider type="vertical" />
            <Button
              style={style}
              type="link"
              onClick={async () => {
                const key = (new Date()).toString();

                try {
                  message.loading({
                    content: '修复中...',
                    duration: 1000,
                    key: key
                  });
                  await fixACluster(row.code);
                  message.success({
                    content: '修复成功！',
                    key
                  });
                } catch (e) {
                  message.error({
                    content: `修复失败：${e.message}`,
                    key
                  });
                }

                setTimeout(() => {
                  message.destroy(key);
                }, 1000);
              }}
            >
              修复
            </Button>
          </div>
        );
      },
    },
  ];

  const onFixAllCluster = async () => {
    const key = 'fix-cluster';
    const total = clusterList.length;
    let success = 0;
    let failed = 0;

    setFixing(true);

    await Promise.all(_.chunk(clusterList, 5).map(async list => {
    // eslint-disable-next-line
    for (let cluster of list) {
        const {code, name} = cluster;

        message.loading({
          content: `[${success}/${total}] 修复集群 ${name} 中`,
          key,
          duration: 1000
        });

        try {
          success++;
          await fixACluster(code);
          message.loading({
            content: `[${success}/${total}] 集群 ${name} 修复成功！`,
            key,
            duration: 1000
          });
        } catch (e) {
          failed++;
        }
      }
    }));


    setFixing(false);
    message.success({
      content: `所有集群修复完毕，成功 ${total - failed} 个，失败 ${failed} 个！`,
      key,
      duration: 1000
    });

    message.destroy(key);
  };

  /**
   * 调用API，订正某一个集群的信息
   * @param clusterCode
   */
  const fixACluster = async (clusterCode) => {
    await clusterApi.fixCluster(clusterCode);
    await getCluster();
  };

  return (
    <div>
      <CommonTitle
        searchVisible
        onSearch={onSearch}
      >
        集群管理
      </CommonTitle>
      <Button
        type="primary"
        className="margin-b10"
        onClick={onAddCluster}
      >
        + 添加集群
      </Button>
      &nbsp;&nbsp;
      <Button
        className="margin-b10"
        onClick={onFixAllCluster}
        loading={fixing}
      >
        修复集群
      </Button>
      <Table
        loading={props.loading}
        columns={cols()}
        dataSource={dataSource}
        rowKey="id"
        pagination={{
          pageSize: 100
        }}
      />
    </div>
  );
};

UserManager.propTypes = {
  loading: PropTypes.bool,
  dispatch: PropTypes.func
};

const mapStateProps = (state) => {
  const loading = state.loading;
  const clusterLoading = _.get(loading.effects, 'global/getCluster');

  return {
    ...state.global,
    loading: clusterLoading,
  };
};

export default connect(mapStateProps)(UserManager);
