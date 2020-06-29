import React from 'react';
import _ from 'lodash';
import {Select} from 'antd';
import PropTypes from 'prop-types';

import {clusterType} from '@lib/prop-types';

const ClusterSelector = (props) => {
  const clusters = _.get(props, 'clusters');
  const value = _.get(props, 'value');
  const onChange = _.get(props, 'onChange');

  const getOptions = (clusters) => {
    return Object.keys(clusters).map((clusterCode) => {
      const cluster = clusters[clusterCode];

      return (
        <Select.Option
          value={clusterCode}
          key={clusterCode}
        >
          {clusterCode + '（' + cluster.name + '）'}
        </Select.Option>
      );
    });
  };

  return (
    <div>
      <Select
        value={value}
        style={{width: '200px'}}
        onChange={onChange}
      >
        {getOptions(clusters)}
      </Select>
    </div>
  );
};

ClusterSelector.propTypes = {
  clusters: PropTypes.arrayOf(clusterType),
  value: PropTypes.string,
  onChange: PropTypes.func
};

export default ClusterSelector;
