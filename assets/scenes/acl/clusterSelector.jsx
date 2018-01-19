'use strict';

var React = require('react');
let connect = require('react-redux').connect;
let classnames = require('classnames');
import { Modal, Button, Table, Icon, Tag, Select, Input } from 'antd';
const Option = Select.Option;


class ClusterSelector extends React.Component {
constructor(props) {
  super(props);
  this.state = {
      clusters: this.props.clusters || false,
    };
  }
  render() {

    function getOptions(clusters) {
      return clusters.map(function(cluster){
        return <Option value={cluster.cluster_code} key={cluster.cluster_code}>
                  {cluster.cluster_code + '(' + cluster.cluster_name + ')'}
               </Option>
      });
    }

    var defaultCluster = this.state.clusters[0].cluster_code;

    for (var i = 0; i < this.state.clusters.length; i++) {
      if (this.state.clusters[i].cluster_code === window.localStorage.clusterCode) 
        defaultCluster = this.state.clusters[i].cluster_code;
    }

    return (
      <div className="cluster-select-wrap">
        <Select defaultValue={defaultCluster} style={{ width: 'auto' }} className="cluster-selector" onChange={this.props.changeCluster}>
        {getOptions(this.props.clusters)}
        </Select>
      </div>
    );
  }
}

module.exports = ClusterSelector;