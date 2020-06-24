import React, {useCallback} from 'react';
import _ from 'lodash';
import qs from 'qs';
import {connect} from 'dva';
import {Spin, Tooltip} from 'antd';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {DesktopOutlined, ReloadOutlined} from '@ant-design/icons';
import {withRouter, routerRedux} from 'dva/router';
import useOnclickOutside from 'react-cool-onclickoutside';

import s2q from '@lib/search-to-query';
import WhiteSpace from '@coms/white-space';

import './index.less';

// FIXME: 该组件在 window 点击多次会造成 click 不可用 以及和别的按钮的冲突
const ClusterDrawer = (props) => {
  const {
    clusters, visible, dispatch,
    currentClusterCode, loading,
    setGlobalClusterCode, location,
    onClose, freqClusters
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
            const isActive = cluster.code === currentClusterCode;

            return (
              <div
                key={cluster.code}
                className={classnames('cluster-item', {active: isActive})}
                onClick={onSetCluster(cluster.code)}
              >
                <DesktopOutlined /> {cluster.name}（{cluster.code}）
              </div>
            );
          })
        }

        <div className="cluster-title cluster-list-title">
          集群列表
          <WhiteSpace />
          <Tooltip title="检测集群健康状态">
            <span className="health-check-btn">
              <ReloadOutlined />
            </span>
          </Tooltip>
        </div>
        {
          Object.keys(clusters).map(clusterCode => {
            const cluster = clusters[clusterCode];
            const {name} = cluster;
            const isActive = currentClusterCode === clusterCode;

            return (
              <div
                key={clusterCode}
                className={classnames('cluster-item', {active: isActive})}
                onClick={onSetCluster(clusterCode)}
              >
                <DesktopOutlined /> {name}（{clusterCode}）
              </div>
            );
          })
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
  freqClusters: PropTypes.array           // 常用集群
};

const mapState2Props = (state) => {
  const clusters = state.global.clusters;
  const loading = state.loading;
  const currentClusterCode = state.global.currentClusterCode;
  const clusterLoading = _.get(loading.effects, 'global/getCluster');
  const freqClusters = state.global.freqClusters;

  return {
    clusters,
    loading: clusterLoading,
    currentClusterCode: currentClusterCode,
    freqClusters // 常用集群
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

  return {
    setGlobalClusterCode,
    dispatch
  };
};

export default withRouter(connect(mapState2Props, mapDispatchToProps)(ClusterDrawer));
