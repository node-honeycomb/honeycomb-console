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
    if(_.isEmpty(_.get(window.clusterList, [this.clusterCode]))) {
      this.context.router.push('/honeycomb-console/pages/clusterMgr');
    } else if(_.isEmpty(this.clusterCode) || _.isEmpty(this.localClusterCode)){
      debugger;
      this.showModal();
    }
  }

  showModal = () => {
    this.setState({
      visible: true,
    });
  }
  handleOk = (e) => {
    let clusterMeta = window.clusterList;
    let {chooseCluster} = this.state;
    this.setState({
      visible: false,
    });
    localStorage.setItem('clusterCode', chooseCluster);
    this.context.router.push({pathname: window.prefix + '/pages/list', query:{clusterCode: chooseCluster}});
  }

  chooseCluster = (value) => {
    this.setState({
      chooseCluster: value,
    });
  }
  getSelectedKeys = () =>{
    let selectedKeys =_.last(window.location.pathname.split('/'));
    return selectedKeys
  }
  render() {
    let meta = window.clusterList;
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
              _.map(window.clusterList, (value,key)=>{
                return(
                  <Button key={key} onClick={this.chooseCluster.bind(this,key)}>
                    <span className={this.state.chooseCluster === key ? 'active-cluster' : null} >{value.name + '(' + key + ')'}</span>
                  </Button>
                )
              })
            }
          </div>
        </Modal>
        <Header
          chooseCluster={this.state.chooseCluster}
        />
        <div className="main-wrap">
          <div className="main-wrap-aside">
            <SideBar
              selectedKeys={this.getSelectedKeys()}
            />
          </div>
          <div className="main-wrap-main">
            {React.cloneElement(this.props.children, { showModal: this.showModal })}
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

