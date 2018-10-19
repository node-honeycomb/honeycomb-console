'use strict';

var React = require('react');
var ReactRouter = require('react-router');
var antd = require('antd');
var Link = require('react-router').Link;
let {Menu, Icon, Popover, Card, Modal, Collapse} = require('antd');
const SubMenu = Menu.SubMenu;
const confirm = Modal.confirm;
const Panel = Collapse.Panel;
let User = require("../../../services/user");
const URL = require("url");
import { ReactContext } from 'react-router';
const connect = require('react-redux').connect;
const classnames = require('classnames');

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
      currentUser: currentUser || this.clusterMeta.meta[URL.parse(window.location.href, true).query.clusterCode].name,
      memeryWarning: false,
      isRedWarning: false
    };
    this.checkServerVersion(clusterCode);
    window.addEventListener('warning',()=>{
      this.state.warning = true;
    });
    window.addEventListener('memeryWarning',()=>{
      this.state.memeryWarning = true;
    });
    this.diskCapacityLimit = 0.8;
    this.memoryUsageLimit = 80;
    this.diskCapacityFields = [
      'data.diskInfo.serverRoot.capacity',
      'data.diskInfo.logsRoot.capacity',
      'data.memoryUsage'
    ];
    this.memoryFields = [
      'data.memoryUsage'
    ];
  }
  componentDidMount = () => {
    let clusterCode = URL.parse(window.location.href, true).query.clusterCode;
    this.checkServerVersion(clusterCode);
  }
  checkServerVersion = (clusterCode) => {
    this.props.getStatus({clusterCode: clusterCode}).then((result) => {
      let serverSecure = true;
      let serverList = result.success;
      let memeryWarning = false;
      let isRedWarning = false;
      serverList.forEach((server) => {
        if (server.data.serverVersion < window.secureServerVersion) {
          serverSecure = false;
        }
        this.diskCapacityFields.map(d => {
          if(_.get(server, d) > this.diskCapacityLimit - 0.2) {
            memeryWarning = true;
          }
          if(_.get(server, d) > this.diskCapacityLimit) {
            isRedWarning = true;
          }
        });
        this.memoryFields.map(d => {
          if(_.get(server, d) > this.memoryUsageLimit - 20) {
            memeryWarning = true;
          }
          if(_.get(server, d) > this.memoryUsageLimit) {
            isRedWarning = true;
          }
        });
      });
      this.setState({
        serverSecure,
        memeryWarning,
        isRedWarning
      });
    }).catch(err => {
      console.log(err);
    });
  }
  changeCluster = (e)=>{
    let clusterMeta = this.props.clusterMeta;
    this.setState({
      currentCluster: e.key,
    });
    this.checkServerVersion(e.key);
    localStorage.setItem('clusterCode', e.key);
    this.context.router.push({pathname: window.prefix + '/pages/list', query:{clusterCode: e.key}});
  }
  onShowMemoryWarn = () => {
    let status = _.get(this.props.appMeta, 'status') || [];
    let content = (<div className='memory-warn-wrap'>
      {
        _.map(status, (item, index)=>{
          return(
            <Card key={index} title={"机器："+item.ip} >
              <Collapse className='warning-detail-wrap' bordered={false}>
                <Panel header="Details" key="1">
                {_.map(item.data, (v, k)=>{
                  if (!(_.isArray(v) || _.isObject(v)) && k !== 'memoryUsage') {
                    return(
                      <p key={k}>{k} : {v}</p>
                    )
                  }
                })}
                </Panel>
              </Collapse>
              <p className={classnames({'fontColorRed': _.get(item, 'data.memoryUsage') > this.memoryUsageLimit, 'fontColorYellow': _.get(item, 'data.memoryUsage') > this.diskCapacityLimit - 20})} key='memoryUsage'>{'memoryUsage : ' +  _.get(item, 'data.memoryUsage')}</p>
              {_.map(item.data, (v, k)=>{
                if (_.isObject(v) && !_.isArray(v)) {
                  return(
                    <p  key={k}>
                      {k} : {_.map(v, (value, key) => {
                        return <p className='marginLf' key={key}>{key} : {_.map(value, (_v, _k) => {
                          return <p className={classnames({'marginLf': true, 'fontColorRed': _k === 'capacity' && _v > this.diskCapacityLimit, 'fontColorYellow': _k === 'capacity' && _v > this.diskCapacityLimit - 0.2})} key={_k}>{_k} : {_v}</p>
                        })}
                        </p>
                      })}
                    </p>
                  )
                }
              })}
            </Card>
          )
        })
      }
    </div>);
    Modal.warning({
      title: '报警机器',
      content,
      width: '60%',
      className: 'memory-warning-modal-wrap',
      maskClosable: true
    });
  }
  render() {
    let clusterMeta = _.cloneDeep(this.props.clusterMeta);
    _.map(clusterMeta.meta, (value, key)=>{
      return  value.code = key
    })
    let clusterList = _.sortBy(clusterMeta.meta, [function(o) { return o.name; }]);
    let workspacesList = _.map(clusterList, (menu, index) => {
      return (
        <Menu.Item key={menu.code}>
            <a>{menu.name}</a>
          </Menu.Item>
      );
    });
    let clusterName = _.get(clusterMeta.meta, [this.state.currentCluster, 'name']) || _.get(clusterMeta.meta, [this.props.chooseCluster, 'name']);
    let clusterCode = URL.parse(window.location.href, true).query.clusterCode || '';
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
        {this.state.memeryWarning && (
          <div onClick={this.onShowMemoryWarn} className="admin-console-clusterInfo" >
            <span className={classnames({'clusterName': true, 'fontColorRed': this.state.isRedWarning, 'fontColorYellow': !this.state.isRedWarning})}>
              <Icon type="exclamation-circle-o" />
              内存报警
            </span>
          </div>
        )}
        {this.state.warning && (<div className="admin-console-clusterInfo" >
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
        </div>)}
        <Menu mode="horizontal">
          {window.oldConsole && <SubMenu key="retweet" title={<span><Icon type="retweet" /><a href={window.oldConsole}>{'返回旧版'}</a></span>}>
          </SubMenu>}
          <SubMenu key="sub1" title={<span><Icon type="user" />{this.state.currentUser}</span>}>
          </SubMenu>
          <SubMenu key="logout" title={<span><Icon type="logout" /><a href={window.prefix + '/logout'}>{'退出登录'}</a></span>}>
          </SubMenu>
        </Menu>
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
  getStatus : actions.app.getStatus
})(Header);
