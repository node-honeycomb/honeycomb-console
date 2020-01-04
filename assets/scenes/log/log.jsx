'use strict';

var React = require('react');
let connect = require('react-redux').connect;
let classnames = require('classnames');
let moment = require('moment');
import { Modal, Button, Table, Icon, Tag, Tooltip, Menu, DatePicker, Form, Input, Select, TimePicker, Switch, Spin } from 'antd';
var SubMenu = Menu.SubMenu;
const FormItem = Form.Item;
const Option = Select.Option;
let ReactDom = require('react-dom');
var $ = require('jquery');
require('./log.less');
import { RouteContext } from 'react-router';
const URL = require("url");

class Log extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.data = props.location.query ? props.location.query : null;
    this.state = {
      fileName: 'server.'+moment().format("YYYY-MM-DD")+'.log',
      fileNameOrigin: 'server.{year}-{month}-{day}.log',
      logDate: '',
      logLines: '',
      startTime: '',
      ips: '',
      filterString: '',
      clusterCode:'',
      isQuery: false,
      loading: false
    }
  }
  componentDidMount = () => {
    this.setState({loading: true});
    let clusterCode = URL.parse(window.location.href, true).query.clusterCode;
    this.setState({ clusterCode: clusterCode });
    let fileName = this.state.fileName;
    let fileNameOrigin = this.state.fileNameOrigin;
    let data = this.data;
    if(data && data.name){
      if(data.name.indexOf('__') > -1){
        fileName = 'server.'+data.date+'.log';
        fileNameOrigin = 'server.{year}-{month}-{day}.log';
      }else{
        fileName = data.name+'/sys.'+data.date+'.log';
        fileNameOrigin = data.name+'/sys.{year}-{month}-{day}.log';
      }
      let _date = data.date +' '+data.time || null;
      let _time = moment(_date).subtract(5, 'seconds').format("HH:mm:ss");
      let newState = {
        fileName: fileName,
        fileNameOrigin: fileNameOrigin,
        clusterCode: clusterCode,
        logDate: data.date,
        startTime: _time,
        ips: data.ip
      }
      this.setState(newState);
      this.props.queryLog(newState).then((d) => {
        this.setState({
          loading: false,
        });
      });
    }else{
      this.props.queryLog({
        fileName: fileName,
        clusterCode: clusterCode
      }).then(() => {
        this.setState({
          loading: false,
        });
      });
    }

  }
  componentDidUpdate = () => {
    let dom = $(ReactDom.findDOMNode(this)).find("#log-pre-pre")[0];
    if (dom) {
      setTimeout(function () {
        dom.scrollTop = dom.scrollHeight;
      }, 0);
    }
  }

  replaceFilename = (_date, _time, fileName) => {
    let date = _.isEmpty(_date) ? moment().format("YYYY-MM-DD").split('-') : _date.split('-');
    let time = _.isEmpty(_time) ? moment().format("HH:mm:ss").split(':') : _time.split(':');
    fileName = _.replace(fileName, '{year}', date[0]);
    fileName = _.replace(fileName, '{month}', date[1]);
    fileName = _.replace(fileName, '{day}', date[2]);
    fileName = _.replace(fileName, '{hour}', time[0]);
    fileName = _.replace(fileName, '{minute}', time[1]);
    fileName = _.replace(fileName, '{second}', time[2]);
    return fileName;
  }

  handleClick = (e) => {
    let{ logDate, startTime } = this.state;
    let fileName = e.key;
    this.setState({
      fileNameOrigin: fileName,
      loading:true
    });
    fileName = this.replaceFilename(logDate, startTime, fileName);
    this.setState({
      fileName: fileName,
      logDate: '',
      logLines: '',
      startTime: '',
      ips: '',
      filterString: '',
      isQuery: false,
      isRefresh:false,
    });
    this.props.queryLog({
      fileName:fileName,
      clusterCode:this.state.clusterCode
    }).then((d) => {
      this.setState({
        loading: false,
      });
    });
  }

  getLogContent = (operation, event) => {
    let newState = _.cloneDeep(this.state) || {};
    let { logDate, startTime, fileNameOrigin} = this.state;
    if (operation === "date") {
      newState.logDate = event ? moment(event).format("YYYY-MM-DD") : null;
      newState.fileName = this.replaceFilename(newState.logDate, startTime, fileNameOrigin);
    }else if(operation === "time"){
      newState.startTime = event ? moment(event).format("HH:mm:ss"):null;
      newState.fileName = this.replaceFilename(logDate, newState.startTime, fileNameOrigin);
    } else if (operation === "ips") {
      newState.ips = event;
    } else {
      newState[operation] = event.target.value;
    }
    this.setState(newState);
  }
  queryLog = () => {
    this.setState({
      isQuery: true,
      loading: true
    });
    let newState = _.cloneDeep(this.state) || {};
    this.props.queryLog(newState).then(() => {
      this.setState({
        isQuery: false,
        loading: false
      });
    });
  }
  setListInterval = (that) => {
    this.setState({ isQuery: true });
    let newState = _.cloneDeep(this.state) || {};
    if(newState.logLines > 100){
      newState.logLines = '100';
    }
    let int = setInterval(function() {
      that.props.queryLog(newState);
    }, 1500);
    this.setState({ int: int });
  }

  componentWillUnmount = () => {
    clearInterval(this.state.int);
  }
  refreshSwitch = (e) => {
    if(e){
      this.setState({
        isRefresh : true
      })
      let that = this;
      this.setListInterval(that);
    }else{
      clearInterval(this.state.int);
      this.setState({
        isQuery: false,
        isRefresh : false
      });
    }
  }
  render() {
    let fileData = [];
    let dir = [];
    let clusterIpList = _.get(window.clusterList, [_.get(URL.parse(window.location.href, true), ['query' ,'clusterCode']), 'ips']);
    clusterIpList  = clusterIpList ? clusterIpList.toString() : '';
    let ips = _.isEmpty(clusterIpList)? [] : clusterIpList.split(',');

    _.forEach(this.props.logMeta.logFile, (value, key) => {
      if (value.indexOf('/') > 0) {
        let arr = value.split('/');
        dir.push(arr[0]);
      } else {
        fileData.push(value);
      }
    });

    return (
      <Spin wrapperClassName="log-wrap-spin" tip="Loading..." spinning={this.state.loading}>
        <div className="log-wrap">
          <div className="log-menu-wrap">
            <h3>log文件列表</h3>
            <div className="log-menu">
              <Menu theme="light" mode="inline" onClick={this.handleClick}>
                {
                  _.uniq(dir).map((value,key) => {
                    return(
                      <SubMenu key={"dir"+key} title={<span>{value}</span>}>
                        {_.map(this.props.logMeta.logFile, (item,index) => {
                          if(item.split("/")[0]===value){
                            return(
                              <Menu.Item key={item}>
                                <Tooltip title={item} placement="right" trigger="hover">
                                  <span>{item.split("/")[1]}</span>
                                </Tooltip>
                              </Menu.Item>
                            )
                          }
                        })}
                      </SubMenu>
                    )
                  })
                }
                {
                fileData.map((item,index) => {
                  return(
                    <Menu.Item key={item} className="log-menu-item">
                      <Tooltip  title={item} placement="right" trigger="hover">
                        <span>{item}</span>
                      </Tooltip>
                    </Menu.Item>
                  )
                })
                }
              </Menu>
            </div>
          </div>
          <div className="log-content">
            <Form layout="inline">
              <FormItem
                label="日志文件"
              >
                {this.state.fileName}
              </FormItem>
              <FormItem
                label="持续刷新"
                className="refresh-switch"
              >
              <Switch onChange={this.refreshSwitch} checkedChildren={'开'} unCheckedChildren={'关'} />
              </FormItem>
              <br/>
              <FormItem>
                <DatePicker disabled={this.state.isRefresh} value={this.state.logDate ? moment(this.state.logDate) : null} onChange={this.getLogContent.bind(this,"date")} format="YYYY-MM-DD" placeholder="选择日期" style={{ width: 120 }}/>
              </FormItem>
              <FormItem>
                <TimePicker disabled={this.state.isRefresh || _.isEmpty(this.state.logDate)} value={this.state.startTime ? moment(this.state.logDate+' '+this.state.startTime) : null} onChange={this.getLogContent.bind(this,"time")} format="HH:mm:ss" placeholder="开始查询时间" style={{ width: 120 }}/>
              </FormItem>
              <FormItem>
                <Select value={this.state.ips} disabled={this.state.isRefresh} onChange={this.getLogContent.bind(this,"ips")} placeholder="全部机器"  >
                  <Option key="" value="">全部机器</Option>
                  {
                    ips.map((item,index) => {
                      return(
                        <Option key={item} value={item}>{item}</Option>
                      )
                    })
                  }
                </Select>
              </FormItem>
              <FormItem
                label="行数"
              >
                <Input onPressEnter={this.queryLog} disabled={this.state.isRefresh} onChange={this.getLogContent.bind(this,"logLines")} placeholder="200" style={{ width: 50 }}/>
              </FormItem>
              <FormItem
                label="关键字"
              >
                <Input onPressEnter={this.queryLog} disabled={this.state.isRefresh} onChange={this.getLogContent.bind(this,"filterString")} placeholder="075d9a8cafde4c4f942af32f17cba18b" style={{ width: 120 }}/>
              </FormItem>
              <FormItem>
                <Button disabled={this.state.isQuery} onClick={this.queryLog} type="primary" size="large">查询</Button>
              </FormItem>
            </Form>
            <div id="log-pre">
              {
                this.props.logMeta.logContent.map((v) => {
                  let m = v.match(/^\d+-\d+:\d+:\d+\.\d+ (\w+)/);
                  let cls = '';
                  if (m) {
                    switch (m[1]) {
                      case 'ERROR':
                        cls = 'error';
                        break;
                      case 'WARN':
                        cls = 'warn';
                        break;
                      default:
                        cls = '';
                    }
                  }
                  return (<pre className={cls}>{v}</pre>)
                })
              }
            </div>
          </div>
        </div>
      </Spin>
    )
  }
}


let mapStateToProps = (store) => {
  let logMeta = store.log;
  let clusterMeta = store.cluster;
  return {
    logMeta,
    clusterMeta
  };
};

let actions = require("../../actions");

module.exports = connect(mapStateToProps, {
  loadLogFiles: actions.log.loadLogFiles,
  queryLog: actions.log.queryLog
})(Log);
