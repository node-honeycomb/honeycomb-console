'use strict';

var React = require('react');
let connect = require('react-redux').connect;
let classnames = require('classnames');
let AddClusterModal = require('./add-cluster-modal.jsx');
let EditClusterModal = require('./edit-cluster-modal.jsx');
import { Modal, Button, Table, Icon, Tag } from 'antd';
const confirm = Modal.confirm;
const ORIGIN_TOKEN = '***honeycomb-default-token***';
require('./clusterMgr.less');
class Cluster extends React.Component {
  state = {
    addClusterModalState: {
      isShow: false,
      info: {}
    },
    editClusterModalState: {
      isShow: false,
      info: {}
    }
  }
  clusterModal = (operation,state,data=this.state.editClusterModalState.info) => {
    if(operation==="add"){
      this.setState({
        addClusterModalState:{
          isShow:state
        },
      });
    }else{
      this.setState({
        editClusterModalState:{
          isShow:state,
          info:data,
        },
      });
    }
  }
  showConfirm = (record) => {
    let that = this;
    confirm({
      title: '确定要删除该集群吗？',
      content: '无法复原，请谨慎操作',
      onOk() {
        that.props.deleteCluster({clusterCode:record.code}).then(()=>{
          that.props.getCluster();
        })
      },
      onCancel() {},
    });
  }
  generateColumns = () => {
    this.columns = [{
      title: 'name',
      render:(text,record,index)=>{
        return(
          <div key={index}>
            {record.name}
            {record.token === ORIGIN_TOKEN && 
              (<a>
                <Icon type="exclamation-circle" style={{ marginLeft: 8,fontSize: 16, color: 'red' }} />
               </a>
              )}
          </div>
        )
      }
    },{
      title:'code',
      key:'code',
      dataIndex:'code'
    },{
      title:'endPoint',
      key:'endPoint',
      dataIndex:'endpoint'
    },{
      title:'token',
      render:(text,record,index)=>{
        return(
          <div key={index}><span>***</span></div>
        )
      }
    },{
      title:'ipList',
      className: 'ip-list',
      render:(text,record,index)=>{
        return(
          <div key={index}>
            {record.ips.map((value,key)=>{
              return(
                <p key={key}>{value}</p>
              )
            })}
          </div>
        )
      }
    },{
      title:'actions',
      key:'actions',
      render:(text,record,index)=>{
        return (
          <div key={index}>
            <Button onClick={this.clusterModal.bind(this,"edit",true,record)}>编辑</Button>
            <Button type="danger" onClick={this.showConfirm.bind(this,record)}>删除</Button>
          </div>
        )
      }
    }]
  }
   render() {
    this.generateColumns();
    let dataSource = _.map(this.props.clusterMeta.meta,function(value,key){
      return  _.assign({},value,{code:key},{key:key});
    });
    if(window.whiteList.indexOf(localStorage.getItem('name'))>=0){
      return(
        <div className="cluster-wrap">
          <div className="addbtn-wrap">
            <Button type="primary" onClick={this.clusterModal.bind(this,"add",true)}>新增集群</Button>
          </div>
          <div className="cluster-table-warp">
            <Table
              columns={this.columns}
              dataSource={dataSource}
              pagination={false}
            />
          </div>
          <AddClusterModal
            getCluster={this.props.getCluster}
            addCluster={this.props.addCluster}
            visible={this.state.addClusterModalState.isShow}
            onHide={this.clusterModal.bind(this,"add",false)}
          />
          <EditClusterModal
            info={this.state.editClusterModalState.info}
            getCluster={this.props.getCluster}
            addCluster={this.props.addCluster}
            visible={this.state.editClusterModalState.isShow}
            onHide={this.clusterModal.bind(this,"edit",false)}
          />
        </div>
      )
    }else{
      return(
        <div className="cluster-wrap">
          <div className="error-font"><span>您没有权限在此页面操作，请联系管理员</span></div>
        </div>
      )
    }
  }
}


let mapStateToProps = (store) => {
  let clusterMeta = store.cluster;
  return {
    clusterMeta
  }
}

let actions = require("../../actions");

module.exports = connect(mapStateToProps,{
  deleteCluster:actions.cluster.deleteCluster,
  getCluster:actions.cluster.getCluster,
  addCluster:actions.cluster.addCluster,
})(Cluster);
