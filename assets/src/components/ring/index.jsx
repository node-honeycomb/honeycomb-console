import React from 'react';
import PropTypes from 'prop-types';
import {
  Chart, Annotation, Axis,
  Tooltip, Interval, Interaction,
  Coordinate,
} from 'bizcharts';
import {Tooltip as AntTooltip} from 'antd';

import {PRIMARY_COLOR, ERROR_COLOR, WARN_COLOR} from '@lib/color';

import './index.less';

const getPercent = (part, all) => {
  if (all === 0) {
    return 0;
  }

  return ((part / all) * 100).toFixed(0);
};

class Ring extends React.Component {
  // FIXME: 这个逻辑没有办法用 hooks 来实现了，没有办法避免更新
  shouldComponentUpdate(nextProps) {
    let isEqual = true;

    ['all', 'part', 'title'].forEach(key => {
      if (!isEqual) {
        return;
      }
      if (nextProps[key] !== this.props[key]) {
        isEqual = false;
      }
    });

    return !isEqual;
  }

  render() {
    const {
      all, part, title, allTitle,
      partTitle, partTooltip, anotherTitle
    } = this.props;

    const data = [
      {
        type: partTitle,
        value: part
      },
      {
        type: anotherTitle,
        value: all - part,
      }
    ];

    const percent = getPercent(part, all);

    let color = PRIMARY_COLOR;

    if (percent >= 75) {
      color = WARN_COLOR;
    } else if (percent >= 85) {
      color = ERROR_COLOR;
    }


    return (
      <div className="ring-card">
        <Chart
          data={data}
          height={120}
          width={120}
          pure
          autoFit
          animate={true}
        >
          <Annotation.Text
            position={['50%', '50%']}
            content={`${percent}%`}
            style={{
              lineHeight: '240px',
              fontSize: '20',
              fill: 'white',
              textAlign: 'center',
            }}
          />
          <Coordinate
            type="theta"
            radius={0.8}
            innerRadius={0.75}
          />
          <Axis visible={false} />
          <Tooltip showTitle={false} />
          <Interval
            adjust="stack"
            position="value"
            shape="sliceShape"
            color={['type', [color, 'rgb(255, 255, 255)']]}
          />
          <Interaction type="element-single-selected" />
        </Chart>
        <div>
          <h3 style={{color: 'white'}}>{title}</h3>
          <AntTooltip title={partTooltip}>
            <div>{partTitle}：{part}</div>
          </AntTooltip>
          <div>{allTitle}：{all}</div>
        </div>
      </div>
    );
  }
}


Ring.propTypes = {
  all: PropTypes.number,
  part: PropTypes.number,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  allTitle: PropTypes.string,
  partTitle: PropTypes.string,
  partTooltip: PropTypes.any,
  anotherTitle: PropTypes.string,
};

export default Ring;

