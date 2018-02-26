'use strict';

var React = require('react');
var Link = require('react-router').Link;
var antd = require('antd');
var classnames = require('classnames');
var Icon = antd.Icon;
var Popover = antd.Popover;
var Menu = antd.Menu;
var SubMenu = Menu.SubMenu;
var _ = require('lodash');
const URL = require("url");
require('./sidebar.less');

class Sider extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      selectedKeys: this.props.selectedKeys,
      clusterCode: window.location.href.split('/pages/')[1]? window.location.href.split('/pages/')[1].split('?')[1]:''
    }
  }

  componentDidUpdate = () => {
    let selectedKey = '';
    let clusterCode = '';
    if(window.location.href.split('/pages/')[1]){
      selectedKey = window.location.href.split('/pages/')[1].split('?')[0];
      clusterCode = window.location.href.split('/pages/')[1].split('?')[1];
    }
    if(selectedKey){
      if(this.state.selectedKeys !== selectedKey){
        this.setState({
          selectedKeys: selectedKey,
          clusterCode: clusterCode
        })
      }else if(this.state.clusterCode !== clusterCode){
        this.setState({
          clusterCode: clusterCode
        })
      }
    }else{
      this.setState({
        selectedKeys: '',
        clusterCode: ''
      })
    }

  }

  handleClick = (e)=> {
    this.setState({
      selectedKeys: e.key
    })
  }
  render() {
    return (
      <div className="admin-console-sidebar">
        <Menu theme="dark" mode="inline" onClick={this.handleClick} selectedKeys={[this.state.selectedKeys]}>
          <Menu.Item key="list" >
            <Link to={'/pages/list?' + this.state.clusterCode}><span><Icon type="bars" />{'应用列表'}</span></Link>
          </Menu.Item>
          <Menu.Item key="publish" >
            <Link to={'/pages/publish?' + this.state.clusterCode}><span><Icon type="rocket" />{'应用发布'}</span></Link>
          </Menu.Item>
          <Menu.Item key="monitor" >
            <Link to={'/pages/monitor?' + this.state.clusterCode}><span><Icon type="line-chart" />{'系统监控'}</span></Link>
          </Menu.Item>
          <Menu.Item key="appsConfig" >
            <Link to={'/pages/appsConfig?'+ this.state.clusterCode}><span><Icon type="setting" />{'配置管理'}</span></Link>
          </Menu.Item>
          <Menu.Item className="log-menu" key="log">
            <Link to={'/pages/log?'+ this.state.clusterCode}><span><Icon type="search" />{'日志查询'}</span></Link>
          </Menu.Item>
          <div className='hr-wrap'></div>
          <Menu.Item key="clusterMgr" >
            <Link to={'/pages/clusterMgr?'+ this.state.clusterCode}><span><Icon type="setting" />{'集群管理'}</span></Link>
          </Menu.Item>
          <Menu.Item key="acl">
            <Link to={'/pages/acl?' + this.state.clusterCode}><span><Icon type="usergroup-add" />{'应用授权'}</span></Link>
          </Menu.Item>
        </Menu>
      </div>
    );
  }
};
module.exports = Sider;
