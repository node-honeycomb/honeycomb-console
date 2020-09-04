import React, {useCallback, useState} from 'react';
import _ from 'lodash';
import qs from 'qs';
import {connect} from 'dva';
import {Spin, Tooltip, Input} from 'antd';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {withRouter, routerRedux} from 'dva/router';
import useOnclickOutside from 'react-cool-onclickoutside';
import {DesktopOutlined, ReloadOutlined, SearchOutlined, LoadingOutlined} from '@ant-design/icons';

import s2q from '@lib/search-to-query';
import WhiteSpace from '@coms/white-space';

import './index.less';


// FIXME: 该组件在 window 点击多次会造成 click 不可用 以及和别的按钮的冲突
const ClusterDrawer = (props) => {
  const {
    clusters, visible, dispatch,
    currentClusterCode, loading,
    setGlobalClusterCode, location,
    onClose, freqClusters, checkClusters,
    checkingClusterCode, checkedClusters
  } = props;

  const onSetCluster = useCallback((clusterCode) => {
    return () => {
      setGlobalClusterCode(clusterCode);
      const query = s2q(location.search);

      query.clusterCode = clusterCode;

      location.search = '?' + qs.stringify(query);

      dispatch(routerRedux.push(location));
    };
  }, []);

  const ref = useOnclickOutside(() => {
    onClose();
  },
  {
    ignoreClass: 'show-cluster-sider'
  });

  const [keyword, setKeyword] = useState('');

  const renderClusterItem = (clusterCode, isFilter = true) => {
    const cluster = clusters[clusterCode];
    const {name} = cluster;
    const isActive = currentClusterCode === clusterCode;

    if (isFilter && (!name.includes(keyword) && !clusterCode.includes(keyword))) {
      return null;
    }

    const status = checkedClusters.find(([cc]) => cc === clusterCode);
    const isChecking = (checkingClusterCode === clusterCode);

    const icon = () => {
      if (isChecking) {
        return <LoadingOutlined />;
      }

      if (!status) {
        return <DesktopOutlined />;
      }

      if (status[1]) {
        return (
          <Tooltip
            placement="topLeft"
            title="健康"
          >
            <DesktopOutlined style={{color: '#329dce'}} />
          </Tooltip>);
      }

      return (
        <Tooltip
          placement="topLeft"
          title={`无法连接：${status[2]}`}
        >
          <DesktopOutlined style={{color: '#d93026'}} />
        </Tooltip>);
    };

    return (
      <Tooltip
        key={clusterCode}
        placement="right"
        title={`${name}（${clusterCode}）`}
      >
        <div
          className={classnames('cluster-item', {active: isActive})}
          onClick={onSetCluster(clusterCode)}
        >
          {icon()}
          {name}（{clusterCode}）
        </div>
      </Tooltip>
    );
  };

  return (
    <div
      className={classnames('cluster-drawer', {visible: visible})}
      ref={ref}
    >
      <Spin spinning={loading}>
        <div className="cluster-title">
          常用集群
        </div>
        {
          freqClusters.map(cluster => {
            return renderClusterItem(cluster.code, false);
          })
        }

        <div className="cluster-title cluster-list-title">
          集群列表
          <WhiteSpace />
          <Tooltip title="检测集群健康状态">
            <span className="health-check-btn" onClick={checkClusters}>
              <ReloadOutlined />
            </span>
          </Tooltip>
          <Input
            className="cluster-search-input"
            size="small"
            suffix={<SearchOutlined />}
            onChange={(e) => setKeyword(e.target.value)}
            value={keyword}
            placeholder="键入以检索集群"
          />
        </div>
        {
          Object.keys(clusters).map(renderClusterItem)
        }
      </Spin>
    </div>
  );
};

ClusterDrawer.propTypes = {
  visible: PropTypes.bool,
  clusters: PropTypes.object,              // 集群列表
  currentClusterCode: PropTypes.string,    // 当前的集群
  loading: PropTypes.bool,                 // 加载中
  setGlobalClusterCode: PropTypes.func,    // 设置当前集群code
  location: PropTypes.object,
  dispatch: PropTypes.func,
  onClose: PropTypes.func,
  freqClusters: PropTypes.array,          // 常用集群
  checkClusters: PropTypes.func,
  checkingClusterCode: PropTypes.string,
  checkedClusters: PropTypes.array
};

const mapState2Props = (state) => {
  const clusters = state.global.clusters;
  const loading = state.loading;
  const currentClusterCode = state.global.currentClusterCode;
  const clusterLoading = _.get(loading.effects, 'global/getCluster');
  const freqClusters = state.global.freqClusters;
  const checkingClusterCode = state.global.checkingClusterCode;
  const checkedClusters = state.global.checkedClusters;

  return {
    clusters,
    loading: clusterLoading,
    currentClusterCode: currentClusterCode,
    freqClusters, // 常用集群
    checkingClusterCode: checkingClusterCode,
    checkedClusters
  };
};

const mapDispatchToProps = (dispatch) => {
  const setGlobalClusterCode = (clusterCode) => {
    return dispatch({
      type: 'global/setCluster',
      payload: {
        clusterCode
      }
    });
  };

  const checkClusters = () => {
    return dispatch({
      type: 'global/checkClusters',
    });
  };

  return {
    setGlobalClusterCode,
    dispatch,
    checkClusters
  };
};

export default withRouter(connect(mapState2Props, mapDispatchToProps)(ClusterDrawer));
