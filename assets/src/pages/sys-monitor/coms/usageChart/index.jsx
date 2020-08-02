import React from 'react';
import PropTypes from 'prop-types';
import {AreaChart} from 'bizcharts';
import {DARK_COLOR, PRIMARY_COLOR} from '@lib/color';

const UsageChart = (props) => {
  const {title, unit, data} = props;

  return (
    <AreaChart
      data={data}
      forceFit={true}
      height={200}
      title={{
        visible: true,
        text: `${title} (${unit})`,
        style: {
          fontSize: 13,
          fill: DARK_COLOR,
        },
      }}
      xField="time"
      yField="value"
      areaStyle={{
        fill: `l (270) 0:rgba(255, 255, 255, 1) 1:${PRIMARY_COLOR}`,
      }}
      line={{
        size: 1,
        style: {
          stroke: PRIMARY_COLOR,
        },
      }}
      color={`${PRIMARY_COLOR}`}
      yAxis={{
        grid: {
          visible: true,
          line: {
            type: 'line',
            style: {
              stroke: '#d9d9d9',
              lineWidth: 1,
              lineDash: [2, 2],
            },
          },
        },
      }}
    />
  );
};

UsageChart.propTypes = {
  title: PropTypes.string,
  unit: PropTypes.string,
  data: PropTypes.object,
};

export default UsageChart;
