import React, {useState, useEffect, useCallback} from 'react';
import _ from 'lodash';
import {connect} from 'dva';
import PropTypes from 'prop-types';
import {
  Table, Button, Divider, Modal,
  message, Tooltip, Tag
} from 'antd';

import {clusterApi} from '@api';
import {useSearch} from '@lib/hooks';
import CommonTitle from '@coms/common-title';
import notification from '@coms/notification';

import clusterUpset from './cluster-upset';

const ENV = {
  prod: <Tag color="green">生产环境</Tag>,
  dev: <Tag>开发环境</Tag>,
  pre: <Tag color="geekblue">预发环境</Tag>
};

const UserManager = (props) => {
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
      'name', 'code', 'endpoint'
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
      render: (row) => {
        if (row.length > 1) {
          const text = row.map(r => {
            return <p key={r}>{r}</p>;
          });

          return <span>
            <span>{_.get(row, '[0]')}</span>
            <Tooltip placement="top" title={text}>
              <span style={{color: '#3D6CF2', cursor: 'pointer'}}>&nbsp;&nbsp;更多</span>
            </Tooltip>
          </span>;
        } else {
          return _.get(row, '[0]');
        }
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
          <div>
            <Button style={style} type="link" onClick={() => handleEdit(row)}>
              编辑
            </Button>
            <Divider type="vertical" />

            <Button style={style} type="link" onClick={() => handleConfirm(row)}>
              删除
            </Button>
          </div>
        );
      },
    },
  ];


  return (
    <div>
      <CommonTitle
        searchVisible
        onSearch={onSearch}
      >
        集群管理
      </CommonTitle>
      <Button type="primary" className="margin-b10" onClick={onAddCluster}>
        + 添加集群
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
