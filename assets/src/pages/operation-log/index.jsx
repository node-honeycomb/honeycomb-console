import React, {useEffect, useState, useCallback} from 'react';
import {connect} from 'dva';
import moment from 'moment';
import api from '@api/index';
import _ from 'lodash';
import PropTypes from 'prop-types';
import {withRouter} from 'dva/router';
import CommonTitle from '@coms/common-title';
import {Table, Tag, Modal, DatePicker, notification} from 'antd';
import {default as MonacoEditor, MonacoDiffEditor} from 'react-monaco-editor';

import ClusterSelector from './coms/cluster-selector';

import './index.less';

const {RangePicker} = DatePicker;

const colorMap = {
  HIGH_RISK: 'red',
  RISKY: 'yellow',
  LIMIT: 'blue',
  NORMAL: 'green',
};

const LEVEL_MAP = {
  HIGH_RISK: '高风险',
  RISKY: '中风险',
  LIMIT: '低风险',
  NORMAL: '无风险',
};

const opItemMap = {
  APP: '应用',
  APP_CONFIG: '应用配置',
  SYSTEM: '系统',
  CLUSTER: '集群',
  WOKER: '机器'
};

const opNameMap = {
  SET_APP_CONFIG: '更新应用配置',
  RESTART_APP: '重启应用',
  RELOAD_APP: '重载应用',
  START_APP: '启动应用',
  STOP_APP: '停止应用',
  PUBLISH_APP: '发布应用',
  DELETE_APP: '删除应用',
  ADD_CLUSTER: '创建集群',
  UPDATE_CLUSTER: '更新集群',
  DELETE_CLUSTER: '删除集群',
  DELETE_COREDUMP: 'DELETE_COREDUMP',
  DELETE_UNKNOWPROCESS: '删除未知的process',
  CLEAN_APP_EXIT_RECORD: '清理应用多余版本',
  REMOVE_WORKER: '删除worker',
  ADD_WORKER: '创建worker',
  REGISTER_WORKER: '注册worker',
  DEL_TMP_WORKER: '注销worker',
  LIST_WORKER: '查看worker',
  DEL_WORKER: '删除worker',
};


// 日志模块
const OperationLog = (props) => {
  const {currentClusterCode, clusters, loading} = props;
  const [clusterCode, setClusterCode] = useState(currentClusterCode);
  const [clusterList, setClusterList] = useState({});
  const [tableLoading, setTableLoading] = useState(false);
  const [dataSource, setDataSource] = useState([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState('');
  const [dateRange, setDateRange] = useState([moment().subtract(1, 'days'), moment()]);
  const [oldConfig, setOldConfig] = useState({});

  const onClose = useCallback(() => {
    setDrawerVisible(false);
  });

  const checkedSetDateRange = useCallback((data) => {
    if (!data) return;
    setDateRange(data);
  });

  useEffect(() => {
    setTableLoading(true);
    setClusterList(loading ? {
      loading: {name: '加载中...'}
    } :
      {
      // eslint-disable-next-line camelcase
        _system_manage: {name: '系统管理'},
        ...clusters
      }
    );
    api.oplogApi.queryOpLog(clusterCode, dateRange[0].format(), dateRange[1].format())
      .then(r => {
        setDataSource(r || []);
        setTableLoading(false);
      })
      .catch(e => {
        notification.error({
          message: '错误',
          description: e.message
        });
      });
  }, [clusterCode, dateRange, loading]);

  return (
    <div>
      <CommonTitle>
        操作日志
      </CommonTitle>
      <div className="param-box">
        <ClusterSelector
          clusters={clusterList}
          value={clusterCode}
          onChange={setClusterCode}
        />
        <div>
          <RangePicker
            value={dateRange}
            format={'YYYY-MM-DD'}
            ranges={{
              近2天: [moment().subtract(1, 'days'), moment()],
              近一周: [moment().subtract(1, 'weeks'), moment()],
              近一月: [moment().subtract(1, 'months'), moment()],
            }}
            onChange={checkedSetDateRange}
          />
        </div>
      </div>
      <Table loading={tableLoading || loading} rowKey="id" columns={[
        {
          title: '时间',
          dataIndex: 'gmtCreate',
          sorter: (a, b) => moment(a.gmtCreate).subtract(moment(b.gmtCreate), 'seconds'),
          render: text => <span>{moment(text).format('YYYY-MM-DD HH:mm')}</span>
        },
        {
          title: '操作名',
          dataIndex: 'opName',
          filters: Object.entries(opNameMap).map(([k, v]) => ({text: v, value: k})),
          onFilter: (value, record) => record.opName === value,
          render: text => <span>{opNameMap[text]}</span>
        },
        {
          title: '操作人',
          dataIndex: 'username'
        },
        {
          title: '操作IP',
          dataIndex: 'socket',
          render: socket => <span>{socket && socket.address || '未记录'}</span>
        },
        {
          title: '操作风险',
          dataIndex: 'opLogLevel',
          render: text => <Tag color={colorMap[text]}>{LEVEL_MAP[text]}</Tag>
        },
        {
          title: '操作对象',
          dataIndex: 'opItem',
          render: text => opItemMap[text]
        },
        {
          title: '操作对象ID',
          dataIndex: 'opItemId',
          filterMultiple: false,
          filterSearch: true,
          filters: Array.from(new Set(dataSource.map(data => data.opItemId)))
            .map(name => ({text: name, value: name})),
          onFilter: (value, record) => record.opItemId === value,
        },
        {
          title: '详细',
          dataIndex: 'detail',
          render: (_, record) => (
            <a onClick={() => {
              if (record.opName === 'SET_APP_CONFIG') {
                setOldConfig(record.extends.oldConfig);
                setSelectedItem(record.extends.newConfig);
                setDrawerVisible(true);

                return;
              }
              setOldConfig(null);
              setSelectedItem(record);
              setDrawerVisible(true);
            }}>
            查看
            </a>
          )
        },
      ]} dataSource={dataSource}></Table>
      <Modal
        title="详情"
        visible={drawerVisible}
        forceRender
        onClose={onClose}
        onCancel={onClose}
        onOk={onClose}
        cancelButtonProps={{style: {display: 'none'}}}
        okText="知道了"
        width="60vw"
        bodyStyle={{
          height: '60vh',
          width: '60vw'
        }}
      >
        {drawerVisible ? (oldConfig !== null ?
          <MonacoDiffEditor
            width="100%"
            height="100%"
            language="json"
            original={JSON.stringify(oldConfig, null, 2)}
            value={JSON.stringify(selectedItem, null, 2)}
            readOnly={true}
            options={{
              automaticLayout: true
            }}
          /> :
          <MonacoEditor
            width="100%"
            height="100%"
            language="json"
            theme="vs"
            value={JSON.stringify(selectedItem, null, 2)}
            options={{
              theme: 'vs',
              readOnly: true,
              automaticLayout: true
            }}
          />
        ) : ''}
      </Modal>
    </div>
  );
};

const mapState2Props = (state) => {
  const loading = state.loading;
  const clusterLoading = _.get(loading.effects, 'global/getCluster');

  return {
    ...state.global,
    loading: clusterLoading,
  };
};

OperationLog.propTypes = {
  currentClusterCode: PropTypes.string,
  dispatch: PropTypes.func,
  currentCluster: PropTypes.object,
  clusters: PropTypes.object,
  loading: PropTypes.bool,
};

export default withRouter(connect(mapState2Props)(OperationLog));
