'use strict';

var React = require('react');
var ReactRouter = require('react-router');
var antd = require('antd');
var Link = require('react-router').Link;
var Menu = antd.Menu;
var Icon = antd.Icon;
var Popover = antd.Popover;
var SubMenu = Menu.SubMenu;
let User = require("../../../services/user");
const URL = require("url");
import { ReactContext } from 'react-router';
const connect = require('react-redux').connect;

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
    };
    this.checkServerVersion(clusterCode);
    window.addEventListener('warning',()=>{
      this.state.warning = true;
    });
  }
  checkServerVersion = (clusterCode) => {
    this.props.getStatus({clusterCode: clusterCode}).then((result) => {
      let serverSecure = true;
      let serverList = result.success;
      serverList.forEach((server) => {
        if (server.data.serverVersion < window.secureServerVersion) {
          serverSecure = false;
        }
      });
      this.setState({
        serverSecure: serverSecure
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
        {this.state.warning && (<div className="admin-console-clusterInfo" >
          <span className="clusterName">
            <Icon type="exclamation-circle-o" />
            <Link to={window.prefix + '/pages/clusterMgr' + (clusterCode ? '?clusterCode=' + clusterCode : '')}> 检测到存在安全隐患</Link>
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