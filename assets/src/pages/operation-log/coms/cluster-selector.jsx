import React from 'react';
import _ from 'lodash';
import {Select} from 'antd';
import PropTypes from 'prop-types';

// import {clusterType} from '@lib/prop-types';

const ClusterSelector = (props) => {
  const clusters = _.get(props, 'clusters');
  const value = _.get(props, 'value');
  const onChange = _.get(props, 'onChange');

  const getOptions = (clusters) => {
    return Object.keys(clusters).sort().map((clusterCode) => {
      const cluster = clusters[clusterCode];

      return (
        <Select.Option
          value={clusterCode}
          key={clusterCode}
        >
          {cluster.name + '（' + clusterCode + '）'}
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
        showSearch
      >
        {getOptions(clusters)}
      </Select>
    </div>
  );
};

ClusterSelector.propTypes = {
  // clusters: PropTypes.arrayOf(clusterType),
  clusters: PropTypes.object,
  value: PropTypes.string,
  onChange: PropTypes.func
};

export default ClusterSelector;
