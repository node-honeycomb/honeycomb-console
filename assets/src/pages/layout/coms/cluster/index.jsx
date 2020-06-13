import React, {useCallback, useEffect} from 'react';
import _ from 'lodash';
import qs from 'qs';
import {Spin} from 'antd';
import {connect} from 'dva';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {DesktopOutlined} from '@ant-design/icons';
import {withRouter, routerRedux} from 'dva/router';

import s2q from '@lib/search-to-query';

import './index.less';

const ClusterDrawer = (props) => {
  const {
    clusters, visible, dispatch,
    currentClusterCode, loading,
    setGlobalClusterCode, location,
    onClose
  } = props;

  let clusterDOM;

  const onSetCluster = useCallback((clusterCode) => {
    return () => {
      setGlobalClusterCode(clusterCode);
      const query = s2q(location.search);

      query.clusterCode = clusterCode;

      location.search = '?' + qs.stringify(query);

      dispatch(routerRedux.push(location));
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const onClick = (e) => {
      let isClickInner = true;

      try {
        isClickInner = e.path.includes(document.getElementsByClassName('cluster-drawer')[0]);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(e);
      }

      if (isClickInner) {
        return;
      }

      window.removeEventListener('click', onClick);

      if (!visible) {
        return;
      }

      if (visible) {
        onClose();
      }
    };

    // 全局点击监听, 非点击本block触发 onClose
    window.addEventListener('click', onClick);
  }, [visible, clusterDOM]);


  return (
    <div
      className={classnames('cluster-drawer', {visible: visible})}
    >
      <Spin spinning={loading}>
        <div className="cluster-title">
          常用集群
        </div>
        <div className="cluster-item">

        </div>

        <div className="cluster-title">
          集群列表
        </div>
        {
          Object.keys(clusters).map(clusterCode => {
            const cluster = clusters[clusterCode];
            const {name} = cluster;

            return (
              <div
                key={clusterCode}
                className="cluster-item"
                onClick={onSetCluster(clusterCode)}
              >
                <DesktopOutlined /> {name}
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
  setGlobalClusterCode: PropTypes.func,     // 设置当前集群code
  location: PropTypes.object,
  dispatch: PropTypes.func,
  onClose: PropTypes.func
};

const mapState2Props = (state) => {
  const clusters = state.global.clusters;
  const loading = state.loading;
  const clusterLoading = _.get(loading.effects, 'global/getCluster');

  return {
    clusters,
    loading: clusterLoading,
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
