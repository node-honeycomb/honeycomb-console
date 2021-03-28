import React from 'react';
import PropTypes from 'prop-types';
import {
  Chart, Annotation, Axis,
  Tooltip, Interval, Interaction,
  Coordinate,
} from 'bizcharts';

import {PRIMARY_COLOR} from '@lib/color';

import './index.less';

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
    const {all, part, title, allTitle, partTitle} = this.props;

    const data = [
      {
        type: allTitle,
        value: all,
      },
      {
        type: partTitle,
        value: part
      }
    ];

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
            content={`${parseInt(part, 10)}/${parseInt(all, 10)}`}
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
            // color="type"
            shape="sliceShape"
            color={['type', [PRIMARY_COLOR, 'rgb(255, 255, 255)']]}
          />
          <Interaction type="element-single-selected" />
        </Chart>
        <div>
          <h3 style={{color: 'white'}}>{title}</h3>
          <div>{partTitle}：{part}</div>
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
  partTitle: PropTypes.string
};

export default Ring;

