'use strict';

var React = require('react');
let connect = require('react-redux').connect;
let classnames = require('classnames');
let moment = require('moment');
import { Modal, Button, Table, Icon, Tag, Popover, Menu, DatePicker, Form, Input, Select, Checkbox, Tooltip , Spin} from 'antd';
const SubMenu = Menu.SubMenu;
const FormItem = Form.Item;
const Option = Select.Option;
const CheckboxGroup = Checkbox.Group;
require('./monitor.less');
let Linechart = require('./linechart.jsx');
const URL = require("url");

class Monitor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      checkedList: [],
      machineCheckedList:[],
      checkSystem: true,
      plainOptions: [],
      startValue: moment().second(0).minute(0),
      hourGap: 1,
      loading: false,
    }
  }
  
  changeMonitorData = (fromTime = moment(), gap = null) => {
    this.setState({loading: true});
    let toTime = moment().format("YYYY-MM-DD-HH");
    if (gap && fromTime) {
      toTime = _.cloneDeep(fromTime).add(gap, 'hours').format("YYYY-MM-DD-HH")
    }
    let param = {
      from: fromTime.format("YYYY-MM-DD-HH"),
      to: toTime,
      clusterCode: URL.parse(window.location.href, true).query.clusterCode
    }
    this.props.queryAppUsages(param).then(() => {
      let{ checkedList, plainOptions } = this.state;
      if(_.isEmpty(checkedList) && _.isEmpty(plainOptions)){
        let checkedList = this.props.monitorMeta.appList;
        this.setState({
          machineCheckedList: _.keys(this.props.monitorMeta.meta).slice(0, 1),
          plainOptions: checkedList,
        })
      }
      this.setState({
        loading: false,
      })
    })
  }
  componentWillMount = () => {
    this.changeMonitorData();
  }

  handleTimeChange = (startValue = this.state.startValue, hourGap = this.state.hourGap) => {
    this.changeMonitorData(moment(startValue), hourGap);
  }
  onCheckSystemChange = (e) => {
    this.setState({
      checkSystem: e.target.checked
    })
  }
  disabledStartDate = (startValue) => {
    return  moment().valueOf() && moment(startValue).valueOf() > moment().valueOf();
  }

  onStartChange = (value) => {
    this.setState({
      startValue: value,
    });
    this.handleTimeChange(value);
  }
  chooseHour = (value) => {
    this.setState({
      hourGap: value,
    });
    this.handleTimeChange(undefined, value);
  }
  range = (start, end) =>{
    const result = [];
    for (let i = start; i < end; i++) {
      result.push(i);
    }
    return result;
  }
  disabledDateTime = () => {
    let hour = moment().format('HH');
    return {
      disabledMinutes: () => this.range(1, 60),
      disabledSeconds: () => this.range(1, 60),
    };
  }
  handleChange = (checkedList) => {
    this.setState({
      checkedList
    });
  }
  handleMachineChange = (machineCheckedList) =>{
    this.setState({
      machineCheckedList
    });
  }
  render() {
    let monitorMeta = this.props.monitorMeta.meta;
    let cpuUsageAll = [];
    let memUsageAll = [];
    let cpuUsageSys = [];
    let memUsageSys = [];
    let data = {};
    _.map(monitorMeta, (item, index) => {
      data[index] = {};
      cpuUsageSys[index] = [];
      memUsageSys[index] = [];
      cpuUsageAll[index] = [];
      memUsageAll[index] = [];
      _.map(item, (value, key) => {
        if (key.indexOf("SYSTEM") > -1) {
          cpuUsageSys[index].push({ name: key, data: value.cpuUsage });
          memUsageSys[index].push({ name: key, data: value.memUsage });
        } else {
          _.map(this.state.checkedList, (v) => {
            if (v === key) {
              cpuUsageAll[index].push({ name: key, data: value.cpuUsage });
              memUsageAll[index].push({ name: key, data: value.memUsage });
            }
          })
        }
      })
      data[index].cpuUsageAll = { ip: index, type: 'cpu', isSys: false, data: cpuUsageAll[index] };
      data[index].memUsageAll = { ip: index, type: 'mem', isSys: false, data: memUsageAll[index] };
      data[index].cpuUsageSys = { ip: index, type: 'cpu', isSys: true, data: cpuUsageSys[index] };
      data[index].memUsageSys = { ip: index, type: 'mem', isSys: true, data: memUsageSys[index] };
    })
    const { startValue, endValue, endOpen, plainOptions, checkedList, machineCheckedList } = this.state;
    return (
      <Spin tip="Loading..." spinning={this.state.loading}>
      <div className="monitor-wrap">
        <div className="app-title">
          <div className="time-select">
            <span>查询时间：</span>
            <DatePicker
              disabledDate={this.disabledStartDate}
              disabledTime={this.disabledDateTime}
              showTime
              format="YYYY-MM-DD HH:00:00"
              defaultValue={this.state.startValue}
              placeholder="起始查询时间"
              showToday={false}
              onOk={this.onStartChange}
            />
            <Select defaultValue="1" style={{ width: 120 }} onChange={this.chooseHour}>
              <Option value="1">查询一小时</Option>
              <Option value="2">查询两小时</Option>
              <Option value="3">查询三小时</Option>
            </Select>
            <Tooltip placement="right" title="可选择查询起始时间1小时，2小时或者3小时内的数据信息">
              <Icon type="question-circle" />
            </Tooltip>
          </div>
          <div id="app-checkbox">
            <span>选择机器：</span>
            <Select
              showSearch
              mode="multiple"
              style={{ width: 200 }}
              value={machineCheckedList}
              placeholder="请选择机器，支持多选、搜索"
              optionFilterProp="children"
              onChange={this.handleMachineChange}
              getPopupContainer={() => document.getElementById('app-checkbox')}
              filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
            > 
              {_.map(data, (value, key)=>{
                return <Option key={key} value={key}>{key}</Option>
              })}
            </Select>

            <div className="system-wrap">
              <Checkbox
                onChange={this.onCheckSystemChange}
                checked={this.state.checkSystem}
              >
                查看系统负载
              </Checkbox>
            </div>

            <span>查看应用：</span>
            <Select
              showSearch
              mode="multiple"
              style={{ width: 400 }}
              value={checkedList}
              placeholder="请选择应用，支持多选、搜索"
              optionFilterProp="children"
              onChange={this.handleChange}
              getPopupContainer={() => document.getElementById('app-checkbox')}
              filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
            > 
              {plainOptions.map((value, key)=>{
                return <Option key={value} value={value}>{value}</Option>
              })}
            </Select>
          </div>
        </div> 
          {
            _.map(data, (item, index) => {
              return(
                <div key={index} className="app-monitor">
                  <span>机器：{index}</span>
                  {item.cpuUsageSys && item.cpuUsageSys.data.length > 0?
                  <div className={classnames({"display-none":!this.state.checkSystem, "sys-monitor":true})}>
                    <Linechart 
                      data={item.cpuUsageSys}
                    />
                    <Linechart 
                      data={item.memUsageSys}
                    />
                  </div> : <div>system数据为空，请检查</div>}
                  {item.cpuUsageAll && item.cpuUsageAll.data.length > 0?
                  <div className={classnames({"display-none":_.isEmpty(this.state.checkedList), "all-monitor":true})}>
                    <Linechart 
                      data={item.cpuUsageAll}
                    />
                    <Linechart 
                      data={item.memUsageAll}
                    />
                  </div> : null}
                </div>  
              )       
            })
          }        
      </div>
      </Spin>
    )
  }
}
let mapStateToProps = (store) => {
  let monitorMeta = store.monitor;
  return {
    monitorMeta
  }
}

let actions = require("../../actions");

module.exports = connect(mapStateToProps, {
  queryAppUsages: actions.monitor.queryAppUsages
})(Monitor);
