import React from 'react';
import {Spin} from 'antd';
import PropTypes from 'prop-types';
import {Chart, LineAdvance} from 'bizcharts';

const SysChart = (props) => {
  const {data, loading} = props;

  return (
    <Spin spinning={loading}>
      <Chart
        padding={[10, 20, 100, 40]}
        autoFit
        height={300}
        data={data}
      >
        <LineAdvance
          shape="smooth"
          point
          area
          position="time*value"
          color="ip"
        />
      </Chart>
    </Spin>
  );
};

SysChart.propTypes = {
  data: PropTypes.array,
  loading: PropTypes.bool
};

export default SysChart;
