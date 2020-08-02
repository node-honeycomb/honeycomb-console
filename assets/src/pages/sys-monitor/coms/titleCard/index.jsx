import React from 'react';
import {Card} from 'antd';
import './index.less';

const TitleCard = (porps) => {
  return (
    <div className="title-card">
      <Card
        bordered={false}
        style={{
          marginBottom: '10px',
        }}
        bodyStyle={{padding: 0}}
      >
        <div className="cover">
          <div className="title">
            <div className="h">{porps.title || ''}</div>
            <p>{porps.des || ''}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TitleCard;
