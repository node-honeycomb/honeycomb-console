'use strict';

var React = require('react');
var ReactRouter = require('react-router');
var antd = require('antd');
var Link = require('react-router').Link;
let {Menu, Icon, Popover, Card, Modal, Collapse, Button, Tag, Row, Col, message, Tooltip} = require('antd');
const SubMenu = Menu.SubMenu;
const confirm = Modal.confirm;
const Panel = Collapse.Panel;
let User = require("../../../services/user");
const URL = require("url");
import { ReactContext } from 'react-router';
const connect = require('react-redux').connect;
const classnames = require('classnames');
const ORIGIN_TOKEN = '***honeycomb-default-token***';

function versionCompare(v1, v2) {
  v1 = v1.replace(/_/g, '.');
  v2 = v2.replace(/_/g, '.');
  const aVer = v1.split('.');
  const bVer = v2.split('.');

  for (let i = 0; i < 3; i++) {
    if (+aVer[i] > +bVer[i]) {
      return 1;
    } else if (+aVer[i] < +bVer[i]) {
      return -1;
    }
  }

  return 0;
}

require('./header.less');
class Header extends React.Component {
  constructor(props, context){
    super(props, context);
    let currentUser = null;
    let currentCluster = null;
    let user = User.getUserSync();
    if (user) {
      currentUser = user.nickname || user.name
    }
    let clusterCode = URL.parse(window.location.href, true).query.clusterCode;
    this.state = {
      warning: false,
      serverSecure: true,
      currentCluster: clusterCode,
      currentUser: currentUser,
      memoryWarning: false,
      isRedWarning: false,
      isShowAllMachineData: {},
      machineDataVisible:false,
      coredumpInfo: [],
      unknowProcess:[],
    };
    if(clusterCode && !_.isEmpty(_.get(window.clusterList, [clusterCode]))) {
      this.checkServerVersion(clusterCode);
    }
    window.addEventListener('warning',()=>{
      this.state.warning = true;
    });
    window.addEventListener('memoryWarning',()=>{
      this.state.memoryWarning = true;
    });
    this.diskCapacityLimit = 0.8;
    this.memoryUsageLimit = 80;
    this.diskCapacityFields = [
      'data.diskInfo.serverRoot.capacity',
      'data.diskInfo.logsRoot.capacity'
    ];
    this.memoryFields = [
      'data.memoryUsage'
    ];
  }
  initApp = () => {
    clearInterval(window.int);
    let clusterCode = URL.parse(window.location.href, true).query.clusterCode;
    if(clusterCode && !_.isEmpty(_.get(window.clusterList, [clusterCode]))){
      this.checkServerVersion(clusterCode);
      this.checkWarning();
      this.props.getCoredump({clusterCode}).then(d => {
        if(d.success) {
          this.setState({
            coredumpInfo: d.success
          });
        }
      });
      this.props.getUnknowProcess({clusterCode}).then(d => {
        if(d.success) {
          this.setState({
            unknowProcess: d.success
          });
        }
      })
    }
  }
  componentDidMount = () => {
    this.initApp();
  }
  checkWarning = () => {
    _.forEach(window.clusterList, function(value,key){
      if(value.token === ORIGIN_TOKEN){
        window.dispatchEvent(new Event('warning'));
      }
    });
  }
  checkServerVersion = (clusterCode) => {
    this.props.getStatus({clusterCode: clusterCode}).then((result) => {
      let serverSecure = true;
      let serverList = result.success;
      let memoryWarning = false;
      let isRedWarning = false;
      serverList.forEach((server) => {
        if (versionCompare(server.data.serverVersion, window.secureServerVersion) < 0) {
          serverSecure = false;
        }
        this.diskCapacityFields.map(d => {
          if(_.get(server, d) && _.get(server, d) > this.diskCapacityLimit - 0.2) {
            memoryWarning = true;
          }
          if(_.get(server, d) && _.get(server, d) > this.diskCapacityLimit) {
            isRedWarning = true;
          }
        });
        this.memoryFields.map(d => {
          if(_.get(server, d) && _.get(server, d) > this.memoryUsageLimit - 20) {
            memoryWarning = true;
          }
          if(_.get(server, d) && _.get(server, d) > this.memoryUsageLimit) {
            isRedWarning = true;
          }
        });
      });
      this.setState({
        serverSecure,
        memoryWarning,
        isRedWarning
      });
    }).catch(err => {
      console.log(err);
    });
  }
  changeCluster = (e)=>{
    this.setState({
      currentCluster: e.key,
    });
    this.checkServerVersion(e.key);
    localStorage.setItem('clusterCode', e.key);
    this.context.router.push({pathname: window.prefix + '/pages/list', query:{clusterCode: e.key}});
    this.initApp();
  }
  onClickShowAllMachineData = (ip) => {
    let isShowAllMachineData = _.cloneDeep(this.state.isShowAllMachineData);
    isShowAllMachineData[ip] = !_.get(isShowAllMachineData, [ip]);
    this.setState({
      isShowAllMachineData
    });
  }
  onShowMemoryWarn = () => {
    this.setState({
      machineDataVisible: true
    })
  }
  onCloseMemoryWarn = () => {
    this.setState({
      machineDataVisible: false
    })
  }
  onDeleteCoredump = (data) => {
    let clusterCode = URL.parse(window.location.href, true).query.clusterCode;
    this.props.deleteCoredump({clusterCode, files: [data]}).then(d => {
      if(d.success) {
        message.success('清除成功');
        this.props.getCoredump({clusterCode}).then(d => {
          if(d.success) {
            this.setState({
              coredumpInfo: d.success
            });
          }
        });
      }
    })
  }
  onDeleteUnknowProcess = (data) => {
    let clusterCode = URL.parse(window.location.href, true).query.clusterCode;
    this.props.deleteUnknowProcess({clusterCode}, {pid: data}).then(d => {
      if(d.success) {
        message.success('清除成功');
        this.props.getUnknowProcess({clusterCode}).then(d => {
          if(d.success) {
            this.setState({
              unknowProcess: d.success
            });
          }
        })
      }
    })
  }
  getClusterInfoStatus = () => {
    let clusterStatus = 'normal'; //three status: 'normal', 'warning', 'error'
    if (this.state.memoryWarning || this.state.coredumpInfo.length > 0 || this.state.unknowProcess.length > 0) clusterStatus = 'warning';
    if (this.state.isRedWarning) clusterStatus = 'error';
    return clusterStatus;
  }

  render() {
    let clusterMeta = window.clusterList;
    _.map(clusterMeta, (value, key)=>{
      return  value.code = key
    })
    let clusterList = _.sortBy(clusterMeta, [function(o) { return o.name; }]);
    let workspacesList = _.map(clusterList, (menu, index) => {
      return (
        <Menu.Item key={menu.code}>
            <a>{menu.name}</a>
          </Menu.Item>
      );
    });
    let clusterName =  _.get(clusterMeta, [this.props.chooseCluster, 'name']) || _.get(clusterMeta, [this.state.currentCluster, 'name']);
    let clusterCode = URL.parse(window.location.href, true).query.clusterCode || '';

    let status = _.get(this.props.appMeta, 'status') || [];
    let width = status.length > 1 ? '890px' : '470px';
    let whiteList = ['cpu', 'cpuNum', 'memory', 'memoryUsage', 'serverVersion', 'sysTime', 'sysLoad', 'diskInfo.logsRoot.capacity', 'diskInfo.serverRoot.capacity']
    let content = (<div className='memory-warn-wrap'>
      {(!this.state.serverSecure || this.state.warning) && <div className='warning-wrap'>
        {!this.state.serverSecure && <span>Server版本过低，请升级至{window.secureServerVersion}以上</span>}
        {this.state.warning &&<span>集群存在安全隐患</span>}
        请前往<Link onClick={this.onCloseMemoryWarn} to={{pathname: window.prefix + '/pages/clusterMgr', query: clusterCode && {clusterCode: clusterCode}, state:{isShowClusterModal: true}}}>集群管理</Link>处理
      </div>}
      {
        _.map(status, (item, index)=>{
          let coredumpFileList = _.get(this.state.coredumpInfo.find(d => d.ip === item.ip), 'data') || [];
          let unknowProcessList = _.get(this.state.unknowProcess.find(d => d.ip === item.ip), 'data') || [];
          return(
            <Card key={index} title={"机器："+item.ip} >
              {coredumpFileList && coredumpFileList.length>0 && <div>
                <Row>
                  <Col style={{color: 'red'}} span={9}>coredump文件：</Col>
                  <Col span={15}>
                    {coredumpFileList.map((d, index)=> {
                      let coredumpFile = _.isObject(d)? d.file : d;
                      const isLongTag = coredumpFile.length > 25;
                      const tagElem = (
                        <Tag className='file-name-wrap' key={index}>
                          {isLongTag ? `${coredumpFile.slice(0, 25)}...` : coredumpFile}
                          <Icon onClick={this.onDeleteCoredump.bind(this, coredumpFile)} type="close" />
                        </Tag>
                      );
                      return isLongTag ? <Tooltip title={coredumpFile} key={index}>{tagElem}</Tooltip> : tagElem;
                    })}
                  </Col>
                </Row>
              </div>}
              {unknowProcessList && unknowProcessList.length>0 &&<div>
              <Row>
                <Col style={{color: 'red'}} span={9}>未知进程：</Col>
                <Col span={15}>
                  {unknowProcessList.map(d => {
                    let unknowProcess = d.info;
                    const isLongTag = unknowProcess.length > 25;
                    const tagElem = (
                      <Tag className='file-name-wrap' key={d.pid}>
                        {isLongTag ? `${unknowProcess.slice(0, 25)}...` : unknowProcess}
                        <Icon onClick={this.onDeleteUnknowProcess.bind(this, d.pid)} type="close" />
                      </Tag>
                    );
                    return isLongTag ? <Tooltip title={unknowProcess} key={d.pid}>{tagElem}</Tooltip> : tagElem;
                  })}
                </Col>
              </Row>
              </div>}
              {!_.get(this.state, ['isShowAllMachineData', item.ip]) ? <div>
                {whiteList.map(d => {
                  let fontColorRed = (d === 'memoryUsage' && _.get(item.data, d) > this.memoryUsageLimit) || ((d === 'diskInfo.logsRoot.capacity' || d === 'diskInfo.serverRoot.capacity') && _.get(item.data, d) > this.diskCapacityLimit);
                  let fontColorYellow = (d === 'memoryUsage' && _.get(item.data, d) > this.memoryUsageLimit - 20) || ((d === 'diskInfo.logsRoot.capacity' || d === 'diskInfo.serverRoot.capacity') && _.get(item.data, d) > this.diskCapacityLimit - 0.2);
                  if(_.toString(_.get(item.data, d))) return (
                    <p className={classnames({fontColorRed, fontColorYellow})} key={d}>{d} : {d.indexOf('capacity') > -1 ? `${_.get(item.data, d) * 100}` : _.toString(_.get(item.data, d))}</p>
                  )
                })}
                <a onClick={this.onClickShowAllMachineData.bind(this, item.ip)}>展示全部信息</a>
              </div> : <div>
                {_.map(item.data, (v, k)=>{
                  let fontColorRed = k === 'memoryUsage' && v > this.memoryUsageLimit;
                  let fontColorYellow = k === 'memoryUsage' && v > this.memoryUsageLimit - 20;
                  if (!_.isObject(v)) {
                    return(
                      <p className={classnames({fontColorRed, fontColorYellow})} key={k}>{k} : {_.toString(v)}</p>
                    )
                  }
                })}
                {_.map(item.data, (v, k)=>{
                  if (_.isObject(v) && !_.isArray(v)) {
                    return(
                      <p  key={k}>
                        {k} : {_.map(v, (value, key) => {
                          return <p className='marginLf' key={key}>{key} : {_.map(value, (_v, _k) => {
                            if(_k === 'capacity' || _k === 'filesystem') {
                              return <p className={classnames({'marginLf': true, 'fontColorRed': _k === 'capacity' && _v > this.diskCapacityLimit, 'fontColorYellow': _k === 'capacity' && _v > this.diskCapacityLimit - 0.2})} key={_k}>{_k} : {_k === 'capacity' ? `${_v * 100}` : _v}</p>
                            }
                          })}
                          </p>
                        })}
                      </p>
                    )
                  }
                })}
                <a onClick={this.onClickShowAllMachineData.bind(this, item.ip)}>收起</a>
              </div>}
            </Card>
          )
        })
      }
    </div>);

    let clusterInfoStatus = this.getClusterInfoStatus();
    return (
      <header className="admin-console-header">
       <a className="admin-console-logo">
          <span className="logo">
            Honeycomb 管理后台
          </span>
        </a>
        <div className="admin-console-clusterName">
          <Menu mode="horizontal" onClick={this.changeCluster}>
            <SubMenu className="switch-cluster" key="workSpaces" title={<span><Icon type="setting" />{clusterName}</span>}>
              {workspacesList}
            </SubMenu>
          </Menu>
        </div>
        {/* <div className="admin-console-clusterInfo">
          当前所在集群：
          <span className="clusterName">{clusterName}</span>
        </div> */}
        <div onClick={this.onShowMemoryWarn} className="admin-console-clusterInfo" >
          <span className={classnames({'clusterName': true, 'fontColorRed': clusterInfoStatus === 'error'})}>
            {clusterInfoStatus === 'error' ? <span><Icon type="exclamation-circle-o" /> 集群异常</span> : <span><Icon type="info-circle-o" /> 集群信息</span>}
          </span>
        </div>
        {/* {this.state.warning && (<div className="admin-console-clusterInfo" >
          <span className="clusterName">
            <Icon type="exclamation-circle-o" />
            <Link to={window.prefix + '/pages/clusterMgr' + (clusterCode ? '?clusterCode=' + clusterCode : '')}>安全隐患</Link>
          </span>
        </div>)}
        {!this.state.serverSecure && (<div className="admin-console-serverSecureInfo" >
          <span className="clusterName">
            <Icon type="info-circle-o" />
            <Link to={window.prefix + '/pages/clusterMgr' + (clusterCode ? '?clusterCode=' + clusterCode : '')}> Server版本过低</Link>
          </span>
        </div>)} */}
        <Menu mode="horizontal">
          {window.oldConsole && <SubMenu key="retweet" title={<span><Icon type="retweet" /><a href={window.oldConsole}>{'返回旧版'}</a></span>}>
          </SubMenu>}
          <SubMenu key="sub1" title={<span><Icon type="user" />{this.state.currentUser}</span>}>
          </SubMenu>
          <SubMenu key="logout" title={<span><Icon type="logout" /><a href={window.prefix + '/logout'}>{'退出登录'}</a></span>}>
          </SubMenu>
        </Menu>
        <Modal
          title={this.state.memoryWarning || this.state.coredumpInfo.length > 0 || this.state.unknowProcess.length > 0 ? '异常集群' : '集群信息'}
          visible={this.state.machineDataVisible}
          width={width}
          className='memory-warning-modal-wrap'
          maskClosable={true}
          onCancel={this.onCloseMemoryWarn}
          footer={[
            <Button key='close' onClick={this.onCloseMemoryWarn}>关闭</Button>,
          ]}
        >
          {content}
        </Modal>
      </header>
    );
  }
};


let mapStateToProps = (store) => {
  let appMeta = store.app;
  return {
    appMeta
  }
}

Header.contextTypes = {
  router: React.PropTypes.object
}

let actions = require("../../../actions");

module.exports = connect(mapStateToProps,{
  getCoredump : actions.app.getCoredump,
  getUnknowProcess: actions.app.getUnknowProcess,
  getStatus : actions.app.getStatus,
  deleteCoredump: actions.app.deleteCoredump,
  deleteUnknowProcess: actions.app.deleteUnknowProcess
})(Header);
