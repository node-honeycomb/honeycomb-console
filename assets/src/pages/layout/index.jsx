import React from 'react';
import PropTypes from 'prop-types';

import {connect} from 'dva';

import Sider from './coms/sider';
import HcHeader from './coms/header';
import ClusterDrawer from './coms/cluster';

import './index.less';

class AppLayout extends React.Component {
  static propTypes = {
    children: PropTypes.element,
    dispatch: PropTypes.func,
    global: PropTypes.shape({
      clusters: PropTypes.object
    }),
    loading: PropTypes.object
  }

  state = {
    clusterVisible: false
  }

  componentDidMount() {
    this.getCluster();
  }

  getCluster = async () => {
    const {dispatch} = this.props;

    dispatch({
      type: 'global/getCluster'
    });
  }

  onToggleCluster = () => {
    this.setState({
      clusterVisible: !this.state.clusterVisible
    });
  }

  render() {
    const {clusterVisible} = this.state;

    return (
      <div>
        <HcHeader
          onToggleCluster={this.onToggleCluster}
        />
        <ClusterDrawer
          visible={clusterVisible}
          onClose={this.onToggleCluster}
        />
        <Sider />
        <div className="main-content">
          {
            this.props.children
          }
        </div>
      </div>
    );
  }
}

export default connect(state => state)(AppLayout);
