/* eslint-disable react/display-name */
/* eslint-disable camelcase */
import React, {useState, useEffect, useCallback} from 'react';
import {
  Table,
  Button,
  Divider,
  Space,
  Select,
  Popconfirm,
  Input,
  Tooltip,
} from 'antd';
import _ from 'lodash';
import moment from 'moment';
import {connect} from 'dva';
import PropTypes from 'prop-types';
import {aclApi, appApi} from '@api';
import CommonTitle from '@coms/common-title';
import notification from '@coms/notification';
import {tryParse} from '@lib/util';
import {clusterType} from '@lib/prop-types';

import ClusterSelector from './cluster-selector';

const DEFAULT_APP = {
  name: '*',
  title: '*（所有APP）'
};

const ClusterAuth = (props) => {
  const {currentClusterCode, clusters, loading: clusterLoading} = props;

  const [loading, setLoading] = useState(true);
  const [aclList, setAclList] = useState([]);
  const [appList, setAppList] = useState([]);
  const [clusterCode, setClusterCode] = useState(currentClusterCode);

  const getAclList = async () => {
    try {
      setLoading(true);
      const list = await aclApi.aclList();

      setAclList(list.filter(item => item.cluster_code === clusterCode));
    } catch (error) {
      notification.error({
        message: '请求权限列表失败',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const getAppList = async () => {
    try {
      const {success} = await appApi.appList(clusterCode);

      setAppList(success);
    } catch (error) {
      notification.error({
        message: '请求应用列表失败',
        description: error.message,
      });
    }
  };

  useEffect(() => {
    (async () => {
      if (!clusterCode) {
        return;
      }
      await getAppList();
      await getAclList();
    })();
  }, [clusterCode]);

  const handleAdd = useCallback(() => {
    const newData = {
      id: -1,
      name: '',
      cluster_admin: 0,
      apps: '',
      cluster_code: this.state.selectedCluster.cluster_code,
      cluster_id: this.state.selectedCluster.cluster_id,
      cluster_name: this.state.selectedCluster.cluster_name,
    };

    setAclList([...aclList, newData]);
  });

  const cancel = (index) => {
    const arr = [...aclList];

    arr.splice(index, 1);
    setAclList(arr);
  };

  const cols = () => [
    {
      title: '用户',
      dataIndex: 'name',
      render: (text) => {
        const maxLength = _.size(text);

        return maxLength >= 25 ? (
          <Tooltip trigger={['hover']} title={text} placement="topLeft">
            <Input defaultValue={text} maxLength={25} />
          </Tooltip>
        ) : (
          <Input defaultValue={text} maxLength={25} />
        );
      },
    },
    {
      title: '权限',
      dataIndex: 'cluster_admin',
      render: (text) => {
        return (
          <Select defaultValue={text + ''} style={{width: 120}}>
            <Select.Option value="1">管理员</Select.Option>
            <Select.Option value="0">普通用户</Select.Option>
          </Select>
        );
      },
    },
    {
      title: '拥有的APP',
      dataIndex: 'apps',
      render: (text) => {
        return (
          <Select
            value={tryParse(text, [])}
            mode="multiple"
            style={{width: 300}}
          >
            {
              [...appList, DEFAULT_APP].map((app) => {
                if (app.name === '__ADMIN__') {
                  return null;
                }

                return (<Select.Option key={app.name}>{app.title || app.name}</Select.Option>);
              })
            }
          </Select>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'gmt_create',
      render: text => moment(text).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '更新时间',
      dataIndex: 'gmt_modified',
      render: text => moment(text).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '操作',
      dataIndex: 'operation',
      render: (text, record, index) => {
        const style = {padding: '0px'};

        return _.get(record, 'key') === -1 ? (
          <div>
            <Popconfirm title="确认保存?" onConfirm={() => this.create(index)}>
              <Button style={style} type="link">
                编辑
              </Button>
            </Popconfirm>
            <Divider type="vertical" />
            <Popconfirm title="确认撤销?" onConfirm={() => cancel(index)}>
              <Button style={style} type="link">
                撤销
              </Button>
            </Popconfirm>
          </div>
        ) : (
          <div>
            <Popconfirm title="确认保存?" onConfirm={() => this.create(index)}>
              <Button style={style} type="link">
                编辑
              </Button>
            </Popconfirm>
            <Divider type="vertical" />
            <Popconfirm
              title="确认删除?"
              onConfirm={() => this.serverDelete(index)}
            >
              <Button style={style} type="link">
                删除
              </Button>
            </Popconfirm>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <CommonTitle>集群授权</CommonTitle>
      <Space style={{marginBottom: '10px'}}>
        <ClusterSelector
          clusters={clusters}
          value={clusterCode}
          onChange={(clusterCode) => setClusterCode(clusterCode)}
        />
        <Button type="primary" onClick={handleAdd}>
          + 添加权限
        </Button>
      </Space>
      <Table
        loading={clusterLoading || loading}
        columns={cols()}
        dataSource={aclList}
        rowKey="id"
      />
    </div>
  );
};

ClusterAuth.propTypes = {
  loading: PropTypes.bool,
  dispatch: PropTypes.func,
  clusters: PropTypes.arrayOf(clusterType),
  currentClusterCode: PropTypes.string
};

const mapStateProps = (state) => {
  const loading = state.loading;
  const clusterLoading = _.get(loading.effects, 'global/getCluster');

  return {
    ...state.global,
    loading: clusterLoading,
  };
};

export default connect(mapStateProps)(ClusterAuth);
