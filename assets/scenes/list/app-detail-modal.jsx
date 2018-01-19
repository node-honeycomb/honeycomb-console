'use strict';

var _ = require("lodash");
var React = require('react');
var antd = require('antd');
let connect = require('react-redux').connect;
let classnames = require('classnames');
let moment = require('moment');
let ReactDom = require('react-dom');
import { Modal, Button, Form, Input, Cascader, Select, Row, Col, Checkbox, Tooltip, Spin, Icon } from 'antd';
const FormItem = Form.Item;
const Option = Select.Option;
let Linechart = require('./linechart.jsx');
require('./list.less');
class AppDetailModal extends React.Component {
  state = {
    time:'1',
  }

  handleTimeChange = (value) => {
    this.setState({
      time: value
    })
    this.props.changeMonitorData(value);
  }
  handleOk = (e) => {
    this.setState({
      time: '1'
    })
    this.props.onHide && this.props.onHide.call({});
  }
  handleCancel = (e) => {
    this.setState({
      time: '1'
    })
    this.props.onHide && this.props.onHide.call({});
  }
  render() {
    let meta = this.props.monitorMeta.meta;
    let data = {};
    let lineData = {};
    let index = this.props.index;
    if (index) {
      _.map(meta, (value, key) => {
        lineData[key] = {};
        data = value[index];
        if (data) {
          lineData[key]['cpuUsage'] = { ip: key, type: 'cpu', data: [{ name: index, data: data.cpuUsage }] };
          lineData[key]['memUsage'] = { ip: key, type: 'mem', data: [{ name: index, data: data.memUsage }] };
        }
      })
    }
    return (
      <div>
        <Modal title="信息监控" visible={this.props.visible} onOk={this.handleOk} onCancel={this.handleCancel}>
          <div className="app-title">
            <div className="time-select">
              <Select value={this.state.time} style={{ width: 120 }} onChange={this.handleTimeChange}>
                <Option value="1">最近一小时</Option>
                <Option value="3">最近三小时</Option>
                <Option value="6">最近六小时</Option>
                <Option value="24">最近十二小时</Option>
              </Select>
            </div>
          </div>
          <h3>app名称: {index}</h3>
          <div className="app-body">
          {
            _.map(lineData, (value,key) => {
              return(
                <div key={key} className="line-chart">
                  <Linechart 
                     data={value.cpuUsage}           
                  />
                  <Linechart 
                     data={value.memUsage}           
                  />
                </div>
              )
            })
          }
          </div>
        </Modal>
      </div>
    )
  }
}
module.exports = AppDetailModal;
