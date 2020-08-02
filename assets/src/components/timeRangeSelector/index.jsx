import React, {useState} from 'react';
// import _ from 'lodash';
import {Dropdown, Form, Button, DatePicker} from 'antd';
import moment from 'moment';
import PropTypes from 'prop-types';
import {DownOutlined, HistoryOutlined} from '@ant-design/icons';
import {recentTimeRange} from './options';
import {translateTimeAliasToCh, getRecentMomentFromTimeAlias} from './util';

import './index.less';

const {RangePicker} = DatePicker;

const TimeRangeSelector = (props) => {
  const {onChange} = props;
  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);
  const [defaultRecentTime, setDefaultRecentTime] = useState('2h');
  const [defaultCustomTime, setDefaultCustomTime] = useState('');

  const recentTimeOpts = recentTimeRange.map((recentDuration) => ({
    label: `${'最近'} ${translateTimeAliasToCh(recentDuration)}`,
    value: recentDuration,
  }));

  const handleVisibleChange = (flag) => {
    setVisible(flag);
  };

  const handleRecentWrapperClick = (e) => {
    const {value} = e.target.dataset;

    if (value) {
      const {from, to} = getRecentMomentFromTimeAlias(value);

      setDefaultRecentTime(`${value}`);
      setDefaultCustomTime('');
      setVisible(false);

      onChange({
        from,
        to,
      });
    }
  };

  const renderRecentOpts = () => {
    return (
      <div className="recentWrapper">
        <div className="timeRange-title">选择时间范围</div>
        <ul onClick={handleRecentWrapperClick}>
          {recentTimeOpts.map(({label, value}) => (
            <li
              key={label}
              data-value={value}
              className={`${value === defaultRecentTime ? 'cur' : null}`}
            >
              {`${label}`}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  function disabledDate(current) {
    // Can not select days before today and today
    return current && current > moment().endOf('day');
  }
  const onFinish = (fieldsValue) => {
    const rangeTimeValue = fieldsValue['rangerPicker'];
    const values = {
      from: rangeTimeValue[0].format('YYYY-MM-DD-HH-mm'),
      to: rangeTimeValue[1].format('YYYY-MM-DD-HH-mm'),
    };

    const customTime = `${rangeTimeValue[0].format(
      'YYYY年 M月 DD日 HH:mm'
    )} ~ ${rangeTimeValue[1].format('YYYY年 M月 DD日 HH:mm')}`;

    setDefaultCustomTime(customTime);
    setVisible(false);
    onChange({
      from: values.from,
      to: values.to,
    });
  };

  const renderCustomOpts = () => {
    return (
      <div className="customWrapper">
        <div className="timeRange-title">自定义时间范围</div>
        <Form
          layout={'vertical'}
          form={form}
          initialValues={{
            rangerPicker: [moment().subtract(1, 'hour'), moment()],
          }}
          onFinish={onFinish}
        >
          <Form.Item
            name="rangerPicker"
            label="时间范围"
            rules={[
              {type: 'array', required: true, message: '请选择时间范围!'},
            ]}
          >
            <RangePicker
              style={{width: '100%'}}
              disabledDate={disabledDate}
              showTime={{format: 'HH:mm'}}
              format="YYYY-MM-DD HH:mm"
              placeholder={['开始时间', '结束时间']}
            />
          </Form.Item>
          <Form.Item>
            <Button
              htmlType="button"
              style={{marginRight: '8px'}}
              onClick={() => setVisible(false)}
            >
              取消
            </Button>
            <Button htmlType="submit" type="primary">
              确定
            </Button>
          </Form.Item>
        </Form>
      </div>
    );
  };

  const renderButtonText = () => {
    return defaultCustomTime === '' ?
      `${'最近'} ${translateTimeAliasToCh(defaultRecentTime)}` :
      `${defaultCustomTime}`;
  };

  const timeRange = () => {
    return (
      <div className="timeRange-dropdown">
        {renderRecentOpts()}
        {renderCustomOpts()}
      </div>
    );
  };

  return (
    <Dropdown
      overlay={timeRange()}
      trigger={['click']}
      visible={visible}
      onVisibleChange={handleVisibleChange}
    >
      <div className="time-select__button">
        <div className={`button__content ${visible ? 'active' : null}`}>
          <HistoryOutlined style={{fontSize: '12px'}} />
          <div className="button__text">{renderButtonText()}</div>
          <DownOutlined
            className="button__arrow"
            style={{fontSize: '12px'}}
          />
        </div>
      </div>
    </Dropdown>
  );
};

TimeRangeSelector.propTypes = {
  onChange: PropTypes.func,
};

export default TimeRangeSelector;
