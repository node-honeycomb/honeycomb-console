import React, {useEffect, useState, useCallback} from 'react';
import {connect} from 'dva';
import api from '@api/index';
import CommonTitle from '@coms/common-title';
import {Table, Tag, Drawer, DatePicker} from 'antd';
import PropTypes from 'prop-types';
import {withRouter} from 'dva/router';
import {default as MonacoEditor, MonacoDiffEditor} from 'react-monaco-editor';
import moment from 'moment';

import ClusterSelector from './coms/cluster-selector';


import './index.less';

const {RangePicker} = DatePicker;

const colorMap = {
  HIGH_RISK: 'red',
  RISKY: 'yellow',
  LIMIT: 'blue',
  NORMAL: 'green',
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
  const {currentClusterCode, clusters} = props;
  const [clusterCode, setClusterCode] = useState(currentClusterCode);
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState('');
  const [dateRange, setDateRange] = useState([moment().subtract(1, 'days'), moment()]);
  const [oldConfig, setOldConfig] = useState({});

  clusters['_system_manage'] = {name: '系统管理'};

  const onClose = useCallback(() => {
    setDrawerVisible(false);
  });

  const checkedSetDateRange = useCallback((data) => {
    if (!data) return;
    setDateRange(data);
  });

  useEffect(() => {
    setLoading(true);
    api.oplogApi.queryOpLog(clusterCode, dateRange[0].format(), dateRange[1].format())
      .then(r => {
        setDataSource(r);
        setLoading(false);
      });
  }, [clusterCode, dateRange]);

  return (
    <div>
      <CommonTitle>
        操作日志
      </CommonTitle>
      <div className="param-box">
        <ClusterSelector
          clusters={clusters}
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
      <Table loading={loading} columns={[
        {
          title: '时间',
          dataIndex: 'time',
          sorter: (a, b) => a.time - b.time,
          render: text => <span>{moment(text).format('lll')}</span>
        },
        {
          title: '操作名',
          dataIndex: 'opName',
          filters: Object.entries(opNameMap).map(([k, v]) => ({text: v, value: k})),
          onFilter: (value, record) => record.opName === value,
          render: text => <span>{opNameMap[text]}</span>
        },
        {
          title: '用户名',
          dataIndex: 'username'
        },
        {
          title: '用户地址',
          dataIndex: 'socket',
          render: socket => <span>{socket && `${socket.address} ${socket.port}` || '未记录'}</span>
        },
        {
          title: '操作等级',
          dataIndex: 'opLogLevel',
          render: text => <Tag color={colorMap[text]}>{text}</Tag>
        },
        {
          title: '操作对象',
          dataIndex: 'opItem'
        },
        {
          title: '操作对象Id',
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
          render: (_, record) => <a onClick={() => {
            if (record.opName === 'SET_APP_CONFIG') {
              setOldConfig(record.extends.oldConfig);
              setSelectedItem(record.extends.newConfig);
              setDrawerVisible(true);

              return;
            }
            setOldConfig(null);
            setSelectedItem(record);
            setDrawerVisible(true);
          }}>查看</a>
        },
      ]} dataSource={dataSource}></Table>
      <Drawer height={'50vh'} placement="bottom" visible={drawerVisible} onClose={onClose}>
        {drawerVisible ? (oldConfig !== null ?
          <MonacoDiffEditor
            width="100%"
            height="100%"
            language="json"
            original={JSON.stringify(oldConfig, null, '  ')}
            value={JSON.stringify(selectedItem, null, '  ')}
            readOnly={true}
          /> :
          <MonacoEditor
            width="100%"
            height="100%"
            language="json"
            theme="vs"
            value={JSON.stringify(selectedItem, null, '  ')}
            options={{
              theme: 'vs',
              readOnly: true
            }}
          />
        ) : ''}
      </Drawer>
    </div>
  );
};

const mapState2Props = (state) => {
  return {
    currentClusterCode: state.global.currentClusterCode,
    currentCluster: state.global.currentCluster,
    clusters: state.global.clusters
  };
};

OperationLog.propTypes = {
  currentClusterCode: PropTypes.string,
  location: PropTypes.object,
  dispatch: PropTypes.func,
  currentCluster: PropTypes.object,
  clusters: PropTypes.object,
};

export default withRouter(connect(mapState2Props)(OperationLog));
