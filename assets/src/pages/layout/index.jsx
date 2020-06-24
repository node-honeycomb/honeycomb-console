import React from 'react';
import PropTypes from 'prop-types';

import _ from 'lodash';
import {connect} from 'dva';
import {withRouter} from 'dva/router';

import s2q from '@lib/search-to-query';

import Sider from './coms/sider';
import HcHeader from './coms/header';
import ClusterDrawer from './coms/cluster';

import './index.less';

class AppLayout extends React.Component {
  static propTypes = {
    children: PropTypes.element,
    dispatch: PropTypes.func,
    loading: PropTypes.object,
    currentCluster: PropTypes.shape({
      endpoint: PropTypes.string,
      ips: PropTypes.arrayOf(PropTypes.string),
      name: PropTypes.string
    }),
    currentClusterCode: PropTypes.string
  }

  state = {
    clusterVisible: false
  }

  componentDidMount() {
    this.getCluster();
  }

  getCluster = async () => {
    const {dispatch} = this.props;

    await dispatch({
      type: 'global/getCluster'
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

  render() {
    const {clusterVisible} = this.state;
    const {currentCluster, currentClusterCode} = this.props;

    return (
      <div>
        <HcHeader
          onToggleCluster={this.onToggleCluster}
          currentCluster={currentCluster}
        />
        <ClusterDrawer
          visible={clusterVisible}
          onClose={this.onCloseCluster}
        />
        <Sider currentClusterCode={currentClusterCode} />
        <div className="main-content">
          {
            this.props.children
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
