'use strict';

var React = require('react');
var Header = require('../../coms/commons/header/header.jsx');
var connect = require('react-redux').connect;
const URL = require("url");
var SideBar = require('../../coms/commons/sidebar/sidebar.jsx');
let User = require("../../services/user");
import { Modal, Button} from 'antd';
import { ReactContext } from 'react-router';

require('./app.less');
class App extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      visible: false,
      chooseCluster: null,
    }
    this.localClusterCode = localStorage.getItem('clusterCode');
    this.url = URL.parse(window.location.href, true);
    this.clusterCode = URL.parse(window.location.href, true).query.clusterCode || null;
  }
  componentDidMount = () => {
    if(_.isEmpty(this.clusterCode)&&_.isEmpty(this.localClusterCode)){
      this.showModal();
    }
    let clusterMeta = this.props.clusterMeta;
    if (!Object.keys(clusterMeta.meta).length && location.pathname !== '/pages/clusterMgr') {
      this.context.router.push({pathname: '/pages/clusterMgr', query:{clusterCode: this.clusterCode}});
    }
  }

  showModal = () => {
    this.setState({
      visible: true,
    });
  }
  handleOk = (e) => {
    let clusterMeta = this.props.clusterMeta.meta;
    let {chooseCluster} = this.state;
    this.setState({
      visible: false,
    });
    localStorage.setItem('clusterCode', chooseCluster);
    this.context.router.push({pathname: '/pages/list', query:{clusterCode: chooseCluster}});
  }

  chooseCluster = (value) => {
    this.setState({
      chooseCluster: value,
    })
  }
  getSelectedKeys = () =>{
    let selectedKeys =_.last(window.location.pathname.split('/'));
    return selectedKeys
  }
  render() {
    let meta = this.props.clusterMeta.meta;
    return (
      <div className="app-main-div">
        <Modal title="请选择集群" visible={this.state.visible} width={600}
        footer={
          <div>
            <Button onClick={this.handleOk} type="primary">确认</Button>
          </div>
        }
        >
          <div className="choose-cluster-modal">
            <p>已选集群:  <i>{_.get(meta, [this.state.chooseCluster, 'name'])}</i></p>
            {
              this.props.clusterMeta.result.map((value,key)=>{
                return(
                  <Button key={key} onClick={this.chooseCluster.bind(this,value)}>
                    <span className={this.state.chooseCluster === value ? 'active-cluster' : null} >{meta[value].name+"("+value+")"}</span>
                  </Button>
                )
              })
            }
          </div>
        </Modal>
        <Header
          chooseCluster={this.state.chooseCluster}
          clusterMeta={this.props.clusterMeta}
        />
        <div className="main-wrap">
          <div className="main-wrap-aside">
            <SideBar
              selectedKeys={this.getSelectedKeys()}
            />
          </div>
          <div className="main-wrap-main">
            { this.props.children }
          </div>
        </div>
      </div>
    );
  }
}
let mapStateToProps = (store) => {
  let clusterMeta = store.cluster;
  return {
    clusterMeta
  }
}

App.contextTypes = {
  router: React.PropTypes.object
}
let actions = require("../../actions");

module.exports = connect(mapStateToProps,{
  getAppList : actions.app.getAppList
})(App);

