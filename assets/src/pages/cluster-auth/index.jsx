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
import PropTypes from 'prop-types';
import {connect} from 'dva';
import {aclApi, appApi} from '@api';
import CommonTitle from '@coms/common-title';
import notification from '@coms/notification';
import _ from 'lodash';
// import ClusterSelector from './cluster-selector';

const ClusterAuth = (props) => {
  const [aclList, setAclList] = useState([]);
  const [appList, setAppList] = useState([]);

  const getAclList = async () => {
    try {
      const list = await aclApi.aclList();

      setAclList(list);
    } catch (error) {
      notification.error({
        message: '请求集群列表失败',
        description: error.message,
      });
    }
  };

  const getAppList = async () => {
    try {
      const list = await appApi.appList();

      setAppList(list);
    } catch (error) {
      notification.error({
        message: '请求应用列表失败',
        description: error.message,
      });
    }
  };

  useEffect(() => {
    getAclList();
    getAppList();
  }, []);

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
      title: '名称',
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
            <Select.Option value="1">Admin</Select.Option>
            <Select.Option value="0">User</Select.Option>
          </Select>
        );
      },
    },
    {
      title: '拥有的APP',
      dataIndex: 'apps',
      render: () => {
        return (
          <Select defaultValue={1}>
            {appList.map((app) => {
              if (app === '*')
                return <Select.Option key={'*'}>{'*(所有 APP)'}</Select.Option>;

              return <Select.Option key={app}>{app}</Select.Option>;
            })}
          </Select>
        );
      },
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
        {/* <ClusterSelector clusters={['apple']} /> */}
        <Button type="primary" onClick={handleAdd}>
          添加
        </Button>
      </Space>
      <Table
        loading={props.loading}
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
