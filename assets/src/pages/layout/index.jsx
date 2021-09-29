import React from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import {message} from 'antd';

import {connect} from 'dva';
import {withRouter, routerRedux} from 'dva/router';

import PAGES from '@lib/pages';
import s2q from '@lib/search-to-query';
import callClusterSelect from '@coms/cluster-select';
import {LS_LAST_SELECT_CLUSTER_CODE} from '@lib/consts';

import {clusterApi} from '@api';

import Sider from './coms/sider';
import HcHeader from './coms/header';
import ClusterDrawer from './coms/cluster';

import './index.less';

class AppLayout extends React.Component {
  static propTypes = {
    children: PropTypes.any,
    dispatch: PropTypes.func,
    loading: PropTypes.object,
    currentCluster: PropTypes.shape({
      endpoint: PropTypes.string,
      ips: PropTypes.arrayOf(PropTypes.string),
      name: PropTypes.string
    }),
    currentClusterCode: PropTypes.string,
    location: PropTypes.object
  }

  state = {
    clusterVisible: false,
    errorMsg: null,
    clusters: [],
    clusterStatus: [],
    coreDumps: [],
    unknowProcesses: []
  }

  componentDidCatch(error, info) {
    this.setState({errorMsg: error && error.message});

    console.log(error, info);
  }

  /**
   * 首页逻辑:
   * (1) 读取集群，如果没有集群，自动跳转集群管理页面，建议用户创建集群
   * (2) 如果有集群，并且 query 中有 clusterCode，选择集群
   * (3) 如果有集群，并且localStorage中没有记录，跳出集群选择页面
   * (4) 如果 localStorage 中有上次的记录，并且命中，跳到该集群，不命中，返回（2）
   */
  componentDidMount() {
    this.getCluster();
  }

  getCluster = async () => {
    const {dispatch, location} = this.props;

    const clusters = await dispatch({
      type: 'global/getCluster'
    });

    const AVAILABLE_PAGES = [
      PAGES.CLUSTER_MANAGER,
      PAGES.CLUSTER_AUTH,
      PAGES.USER_MANAGER,
    ];

    if (!clusters || Object.keys(clusters).length === 0) {
      if (!AVAILABLE_PAGES.includes(location.pathname)) {
        location.pathname = PAGES.CLUSTER_MANAGER;

        message.warn('当前无可用集群，请在集群管理中创建集群');

        // 无可用集群, 自动跳转集群管理
        dispatch(routerRedux.push(location));

        return;
      }
    }
    const stop = this.readQueryCluster();

    !stop && await this.renderHistoryCluster(clusters);
    const clusterCode = this.props.currentClusterCode;
    const clusterStatus = await clusterApi.status(clusterCode);
    const coreDump = await clusterApi.getCoredump(clusterCode);
    const unknowPro = await clusterApi.getUnknowProcess(clusterCode);
    const statusObjPro = _.get(clusterStatus, ['success']) || [];
    const statusObjs = statusObjPro.map(pro => {
      return _.get(pro, 'data') || {};
    }) || [];
    const coreDumpArr = _.get(coreDump, ['success']) || [];
    const unkProArr = _.get(unknowPro, ['success']) || [];

    this.setState({
      clusters: clusters,
      clusterStatus: statusObjs,
      coreDumps: coreDumpArr,
      unknowProcesses: unkProArr
    });
  }

  renderHistoryCluster = async (clusters) => {
    const {dispatch} = this.props;
    let lastClusterCode = localStorage.getItem(LS_LAST_SELECT_CLUSTER_CODE);

    if (!clusters || Object.keys(clusters) === 0) {
      return;
    }

    if (!lastClusterCode) {
      lastClusterCode = await callClusterSelect(clusters);
    }

    if (!clusters[lastClusterCode]) {
      lastClusterCode = await callClusterSelect(clusters);
    }

    dispatch({
      type: 'global/setCluster',
      payload: {
        clusterCode: lastClusterCode
      }
    });

    return true;
  }

  readQueryCluster = () => {
    const {dispatch} = this.props;
    const query = s2q(_.get(this, 'props.location.search'));

    const clusterCode = query && query.clusterCode;

    if (!clusterCode) {
      return false;
    }

    dispatch({
      type: 'global/setCluster',
      payload: {
        clusterCode
      }
    });

    return true;
  }

  onCloseCluster = () => {
    this.setState({
      clusterVisible: false
    });

    this.readQueryCluster();
  }

  readQueryCluster = () => {
    const {dispatch} = this.props;
    const query = s2q(_.get(this, 'props.location.search'));

    const clusterCode = query && query.clusterCode;

    if (!clusterCode) {
      return;
    }

    dispatch({
      type: 'global/setCluster',
      payload: {
        clusterCode
      }
    });
  }

  onCloseCluster = () => {
    this.setState({
      clusterVisible: false
    });
  }

  onToggleCluster = () => {
    this.setState({
      clusterVisible: !this.state.clusterVisible
    });
  }

  renderError = () => {
    return (
      <div className="error-msg">😵 Something Went Wrong... <br /> Error: {this.state.errorMsg}</div>
    );
  }

  onDeleteUnknowProcess = async (data) => {
    const code = this.props.currentClusterCode;

    await clusterApi.deleteUnknowProcess(data, {clusterCode: code});
    message.success('清除成功');
    const newUnknows = await clusterApi.getUnknowProcess({clusterCode: code});

    this.setState({
      unknowProcesses: newUnknows.success
    });
  }

  render() {
    const {
      clusterVisible, errorMsg, clusters, clusterStatus, coreDumps, unknowProcesses
    } = this.state;
    const {currentCluster, currentClusterCode} = this.props;

    return (
      <div>
        <HcHeader
          onToggleCluster={this.onToggleCluster}
          clusters={clusters}
          currentCluster={currentCluster}
          clusterStatus={clusterStatus}
          coreDumps={coreDumps}
          unknowProcesses={unknowProcesses}
          onDeleteUnknowProcess={this.onDeleteUnknowProcess}
        />
        <ClusterDrawer
          visible={clusterVisible}
          onClose={this.onCloseCluster}
        />
        <Sider currentClusterCode={currentClusterCode} />
        <div className="main-content" id="main-content">
          {
            errorMsg ? this.renderError() : this.props.children
          }
        </div>
      </div>
    );
  }
}

const mapState2Props = (state) => {
  return {
    currentCluster: state.global.currentCluster,
    currentClusterCode: state.global.currentClusterCode
  };
};

export default withRouter(connect(mapState2Props)(AppLayout));
