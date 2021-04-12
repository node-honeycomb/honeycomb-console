import React from 'react';
import {Spin} from 'antd';
import PropTypes from 'prop-types';
import {Chart, LineAdvance} from 'bizcharts';

const SysChart = (props) => {
  const {data, loading, group = ['ip']} = props;

  return (
    <Spin spinning={loading}>
      <Chart
        padding={[10, 20, 100, 40]}
        autoFit
        height={300}
        data={data}
      >
        {
          group.map(key => {
            return (
              <LineAdvance
                key={key}
                shape="smooth"
                point
                area
                position="time*value"
                color={key}
              />
            );
          })
        }
      </Chart>
    </Spin>
  );
};

SysChart.propTypes = {
  data: PropTypes.array,
  loading: PropTypes.bool,
  group: PropTypes.arrayOf(PropTypes.string)  // 分组，默认按照IP分组
};

export default SysChart;
