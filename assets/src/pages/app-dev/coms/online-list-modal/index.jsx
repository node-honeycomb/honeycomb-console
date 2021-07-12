/* eslint-disable array-callback-return */
/* eslint-disable max-len */
import React, {useState, useEffect} from 'react';
import PropTypes from 'prop-types';
import {Modal, Button, Table, Tag, Spin} from 'antd';
import _ from 'lodash';
import api from '@api/index';
import moment from 'moment';
import {CheckCircleOutlined} from '@ant-design/icons';

import './index.less';

function colorChoose(value) {
  if (value === 'online' || value === 'success') return 'green';
  if (value === 'offline' || value === 'pending') return 'lightgray';
  if (value === 'fail') return 'red';

  return 'orange';
}

const keepOnlineNum = _.get(window, ['appManageConfig', 'keepOnlineNum']) || 3; // 保留的在线版本数量
const keepOfflineNum = _.get(window, ['appManageConfig', 'keepOfflineNum']) || 5; // 保留的离线版本数量


const setClearPolicy = (data) => {
  _.map(data, (value) => {
    // eslint-disable-next-line array-callback-return
    const onlineList = value.filter((item) => {
      if (_.get(item, 'cluster[0].status') === 'online') {
        return item;
      }
    });
    // eslint-disable-next-line array-callback-return
    const offlineList = value.filter((item) => {
      if (_.get(item, 'cluster[0].status') === 'offline') return item;
    });

    let keepOnlineIdx = onlineList.length - keepOnlineNum;
    let keepOfflineIdx = offlineList.length - keepOfflineNum;

    // 在线版本数未达到上限则全部保留
    if (keepOnlineIdx < 0) {
      keepOnlineIdx = 0;
    }
    onlineList.slice(keepOnlineIdx).map(d => {
      d.isKeepOnline = true;

      return d;
    });
    if (keepOfflineIdx < 0) {
      keepOfflineIdx = 0;
    }
    offlineList.slice(keepOfflineIdx).map(d => {
      d.isKeepOffline = true;

      return d;
    });
  });

  return data;
};

const genClearList = (value) => {
  const clearList = {};

  value.forEach(data => {
    // eslint-disable-next-line array-callback-return
    const _onlineList = data.versions.filter((item) => {
      if (_.get(item, 'cluster[0].status') === 'online') return item;
    });
    const _offlineList = data.versions.filter((item) => {
      if (_.get(item, 'cluster[0].status') === 'offline') return item;
    });

    if (_onlineList.length > keepOnlineNum || _offlineList.length > keepOfflineNum) {
      clearList[data.name] = data.versions;
    }
  });

  return clearList;
};

const OnlineListModal = (props) => {
  const {currentClusterCode, visible, onClose} = props;
  const [appList, setAppList] = useState([]);
  const [isOfflineSuccess, setIsOfflineSuccess] = useState({});
  const [isOfflineFailed, setIsOfflineFailed] = useState({});
  const [spinning, setSpinning] = useState({});
  const [isDeleteSuccess, setIsDeleteSuccess] = useState({});
  const [isDeleteFailed, setIsDeleteFailed] = useState({});
  const [deleteSpinning, setDeleteSpinning] = useState({});
  const [isClearing, setIsClearing] = useState(false);
  const [countDownNum, setCountDownNum] = useState(false);

  const genDomIsOffline = (record) => {
    if (record.isKeepOnline) return <span>保留在线</span>;
    if (record.isKeepOffline) return <span></span>;
    if (isOfflineSuccess[record.appId]) return <span style={{color: colorChoose('success')}}>下线成功</span>;
    if (isOfflineFailed[record.appId]) return <span style={{color: colorChoose('fail')}}>下线失败</span>;
    if (record.cluster[0].status === 'offline') return <span></span>;

    return <span style={{color: colorChoose('pending')}}>待下线</span>;
  };

  const genDomIsDelete = (record) => {
    if (isDeleteSuccess[record.appId]) return <span style={{color: colorChoose('success')}}>删除成功</span>;
    if (isDeleteFailed[record.appId]) return <span style={{color: colorChoose('fail')}}>删除失败</span>;
    if (record.isKeepOnline) return <span></span>;
    if (record.isKeepOffline) return <span>保留服务</span>;
    if (record.cluster[0].status === 'online') return <span></span>;

    return <span style={{color: colorChoose('pending')}}>待删除</span>;
  };

  const columns = [{
    title: 'appId',
    dataIndex: 'appId',
    width: 200,
    key: 'appId'
  }, {
    title: '发布时间',
    dataIndex: 'publishAt',
    width: 160,
    key: 'publishAt',
    render: (_text) => {
      return moment(_text).format('YYYY-MM-DD HH:mm:ss');
    }
  }, {
    title: '状态',
    key: 'status',
    render: (_text, record) => {
      if (isOfflineSuccess[record.appId]) {
        return <Tag className="delete-all-status" color={colorChoose('offline')}>offline</Tag>;
      } else {
        return <Tag className="delete-all-status" color={colorChoose(record.cluster[0].status)}>
          {record.cluster[0].status}</Tag>;
      }
    }
  }, {
    title: '下线状态',
    key: 'isOffline',
    // eslint-disable-next-line react/display-name
    render: (text, record) => {
      return <div>
        <Spin spinning={!!spinning[record.appId]} size="small" />
        <span>{spinning[record.appId]}</span>
        {!spinning[record.appId] ? genDomIsOffline(record) : null}
      </div>;
    }
  }, {
    title: '删除状态',
    key: 'isDelete',
    // eslint-disable-next-line react/display-name
    render: (text, record) => {
      return <div>
        <Spin spinning={!!deleteSpinning[record.appId]} size="small" />
        {!deleteSpinning[record.appId] ? genDomIsDelete(record) : null}
      </div>;
    }
  }];

  const getAppList = async () => {
    const {success} = await api.appApi.appList(currentClusterCode);

    if (Object.keys(setClearPolicy(genClearList(success))).length) {
      setAppList(success);
    } else {
      setAppList([]);
    }
  };

  useEffect(() => {
    if (visible) {
      getAppList();
    }
  }, [visible]);

  const delelteApps = async () => {
    const {success} = await api.appApi.appList(currentClusterCode);

    // 获取需要清理的列表
    const _clearList = genClearList(success);
    // 获取需要删除的列表
    let deleteList = [];

    _.map(_clearList, (value) => {
      const offlineList = value.filter(d => d.cluster[0].status === 'offline');

      // 需要保留在机器上的版本数量
      deleteList = _.concat(deleteList, offlineList.slice(0, offlineList.length - keepOfflineNum < 0 ? 0 : offlineList.length - keepOfflineNum));
    });

    for (let i = 0; i < deleteList.length; i++) {
      deleteSpinning[_.get(deleteList, [i, 'appId'])] = true;
      setDeleteSpinning(deleteSpinning);
      try {
        await api.appApi.del(currentClusterCode, deleteList[i].appId);
        isDeleteSuccess[deleteList[i].appId] = true;
        setIsDeleteSuccess(isDeleteSuccess);
        // 关闭加载样式
        deleteSpinning[_.get(deleteList, [i, 'appId'])] = false;
        setDeleteSpinning(deleteSpinning);
      } catch (err) {
        console.log('delelteAppsError', err);
        isDeleteFailed[deleteList[i].appId] = true;
        setIsDeleteFailed(isDeleteFailed);
        deleteSpinning[_.get(deleteList, [i, 'appId'])] = false;
        setDeleteSpinning(deleteSpinning);
      }
    }

    countDownCancel();
  };

  const countDownCancel = () => {
    let n = 3;
    const inter = setInterval(() => {
      if (n === 0) {
        clearInterval(inter);
        handleCancel();
      } else {
        setCountDownNum(n--);
      }
    }, 1000);
  };

  const handleOk = async () => {
    setIsClearing(true);
    // 获取需要清理的列表
    const clearList = genClearList(appList) || [];
    // 获取需要下线的列表
    let stopList = [];

    _.map(clearList, (value) => {
      const onlineList = value.filter(d => d.cluster[0].status === 'online');

      stopList = _.concat(stopList, onlineList.slice(0, onlineList.length - keepOnlineNum < 0 ? 0 : onlineList.length - keepOnlineNum));
    });

    for (let i = 0; i < stopList.length; i++) {
      spinning[_.get(stopList, [i, 'appId'])] = true;

      setSpinning(spinning);

      try {
        await api.appApi.stop(currentClusterCode, stopList[i].appId);
        // 改变下线成功的提示
        isOfflineSuccess[_.get(stopList, [i, 'appId'])] = true;
        setIsOfflineSuccess(spinning);
        // 关闭加载样式
        spinning[_.get(stopList, [i, 'appId'])] = false;
        setSpinning(spinning);
      } catch (err) {
        console.log('offlineAppsError', err);
        isOfflineFailed[_.get(stopList, [i, 'appId'])] = true;
        setIsOfflineFailed(spinning);
        spinning[_.get(stopList, [i, 'appId'])] = false;
        setSpinning(spinning);
      }
    }


    delelteApps();
  };

  const handleCancel = () => {
    setIsClearing(false);
    onClose();
  };

  return (
    <Modal
      title={'服务清理'}
      visible={visible}
      footer={
        <div>
          <Button disabled={isClearing} type="primary" onClick={() => handleOk()}>清理</Button>
          <Button onClick={() => handleCancel()}>关闭窗口{countDownNum && `(${countDownNum})`}</Button>
        </div>
      }
      onCancel={() => handleCancel()}
      width={680}
    >
      <div className="delete-all-list online-list">
        {
          !appList.length &&
          <div className="delete-empty">
            <CheckCircleOutlined className="delete-empty-icon" />
            <p className="delete-empty-p">当前集群很健康，没有需要清理的应用</p>
          </div>
        }
        {
          appList.length > 0 ? <div className="delete-all-subtitle">
            <span>以下应用需要清理版本，点击“清理”会先下线再删除多余版本。</span>
          </div> : null
        }
        {
          appList.length > 0 ? _.map(setClearPolicy(genClearList(appList)), (value, key) => {
            return <Table
              key={key}
              size={'small'}
              pagination={false}
              columns={columns}
              dataSource={value} />;
          }) : null
        }
      </div>
    </Modal>
  );
};

OnlineListModal.propTypes = {
  currentClusterCode: PropTypes.string,
  visible: PropTypes.bool,
  onClose: PropTypes.func,
};

export default OnlineListModal;
