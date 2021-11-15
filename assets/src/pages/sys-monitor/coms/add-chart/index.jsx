import React, {useState} from 'react';
import PropTypes from 'prop-types';
import {Popconfirm, Affix} from 'antd';
import {PlusOutlined, DeleteOutlined} from '@ant-design/icons';

import * as storage from './storage';


const AddChart = (props) => {
  const {onSelect} = props;

  const cards = storage.list();
  // 强制更新
  const [step, setStep] = useState(0);

  const onAdd = () => {
    storage.add();
    setStep(step + 1);
  };

  const onDelete = (key) => {
    storage.detroy(key);
    setStep(step + 1);
  };

  return (
    <div className="add-chart">
      <Affix target={() => document.getElementById('main-content') || document.body}>
        <div>
          {
            cards.map((card) => {
              return (
                <div
                  key={card.key}
                  className="sys-monitor-card"
                  style={{
                    borderLeftColor: card.color
                  }}
                  onClick={() => onSelect(card.key)}
                >
                监控面板{card.key}

                  <span onClick={e => e.stopPropagation()} className="icon-delete-btn">
                    <Popconfirm
                      title="确认删除吗？"
                      onConfirm={() => {
                        onDelete(card.key);
                      }}
                    >
                      <DeleteOutlined />
                    </Popconfirm>
                  </span>
                </div>
              );
            })
          }
        </div>
      </Affix>
      <div className="add-btn" onClick={onAdd}>
        <PlusOutlined /> 应用监控
      </div>
    </div>
  );
};

AddChart.propTypes = {
  onSelect: PropTypes.func
};

export default AddChart;
