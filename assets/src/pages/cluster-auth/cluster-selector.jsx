import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import {Select} from 'antd';

const ClusterSelector = (props) => {
  const clusters = _.get(props, 'clusters');
  const defaultCluster = clusters[0];

  const getOptions = (clusters) => {
    return clusters.map((cluster) => {
      return (
        <Select.Option value={cluster.cluster_code} key={cluster.cluster_code}>
          {cluster.cluster_code + '(' + cluster.cluster_name + ')'}
        </Select.Option>
      );
    });
  };

  return (
    <div>
      <Select defaultValue={defaultCluster} style={{width: 'auto'}}>
        {getOptions(clusters)}
      </Select>
    </div>
  );
};

ClusterSelector.propTypes = {
  clusters: PropTypes.array,
};
export default ClusterSelector;
