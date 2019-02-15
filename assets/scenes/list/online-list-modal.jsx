'use strict';

var _ = require("lodash");
var React = require('react');
var antd = require('antd');
let connect = require('react-redux').connect;
let classnames = require('classnames');
let ReactDom = require('react-dom');
import { Modal, Button, Icon, Table, Tag, Spin} from 'antd';
const confirm = Modal.confirm;
const URL = require("url");

class OnlineListModal extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      isOfflineSuccess:{},
      isOfflineFailed:{},
      isClearing:false,
      spinning: {},
      isDeleteSuccess: {},
      isDeleteFailed: {},
      deleteSpinning: {},
      countDownNum: false
    }
  }
  delelteApps = (that) => {
    // 获取最新的应用列表--主要为了获取刚刚已经下线的应用状态
    let clusterCode = URL.parse(window.location.href, true).query.clusterCode;
    that.props.getAppList({ clusterCode: clusterCode }).then(d => {
      if(d.success && d.success.length > 0) {
        // 获取需要清理的列表
        let _clearList = that.props.genClearList(d.success);
        // 获取需要删除的列表
        let deleteList = [];
        _.map(_clearList, (value, key) => {
          let offlineList = value.filter(d => d.cluster[0].status === 'offline');
          // 需要保留在机器上的版本数量
          let keepOfflineNum = this.props.keepOfflineNum;
          deleteList = _.concat(deleteList, offlineList.slice(0, offlineList.length - keepOfflineNum < 0 ? 0 : offlineList.length - keepOfflineNum))
        });
        // 循环删除应用
        (function deleteApp(i, deleteList) {
          // 打开加载样式
          let deleteSpinning = _.cloneDeep(that.state.deleteSpinning);
          deleteSpinning[_.get(deleteList, [i, 'appId'])] = true;
          that.setState({
            deleteSpinning
          });
          if (deleteList.length < 1) return that.countDownCancel();
          return that.props.deleteApps({ clusterCode: clusterCode }, { appId: deleteList[i].appId})
          .then((d)=>{
            // 改变删除成功的提示
            let isDeleteSuccess = _.cloneDeep(that.state.isDeleteSuccess);
            isDeleteSuccess[deleteList[i].appId] = true;
            // 关闭加载样式
            let deleteSpinning = _.cloneDeep(that.state.deleteSpinning);
            deleteSpinning[_.get(deleteList, [i, 'appId'])] = false;
            that.setState({
              deleteSpinning,
              isDeleteSuccess: isDeleteSuccess
            });
            if(i < deleteList.length-1){
              deleteApp(i+1, deleteList);
            } else {
              that.countDownCancel();
            }
          })
          .catch((err)=>{
            console.log('delelteAppsError', err);
            let isDeleteFailed = _.cloneDeep(that.state.isDeleteFailed);
            isDeleteFailed[deleteList[i].appId] = true;
            let deleteSpinning = _.cloneDeep(that.state.deleteSpinning);
            deleteSpinning[_.get(deleteList, [i, 'appId'])] = false;
            that.setState({
              isDeleteFailed: isDeleteFailed,
              deleteSpinning
            });
            if(i < deleteList.length-1){
              deleteApp(i+1, deleteList);
            } else {
              that.setState({
                isClearing : false
              })
            }
          })
        })(0, deleteList)
      }
    });
  }
  countDownCancel() {
    let n = 3;
    let inter = setInterval(()=>{
      if(n === 0) {
        clearInterval(inter);
        this.handleCancel();
      }else{
        this.setState({
          countDownNum: n--
        });
      }
    },1000)
  }
  handleOk = () => {
    this.setState({isClearing : true});
    let that = this;
    let clusterCode = URL.parse(window.location.href, true).query.clusterCode;
    // 获取需要清理的列表
    let clearList = _.get(this, 'props.clearList') || [];
    // 获取需要下线的列表
    let stopList = [];
    _.map(clearList, (value, key) => {
      let onlineList = value.filter(d => d.cluster[0].status === 'online');
      // 需要保留在线的数量
      let keepOnlineNum = this.props.keepOnlineNum;
      stopList = _.concat(stopList, onlineList.slice(0, onlineList.length - keepOnlineNum < 0 ? 0 : onlineList.length - keepOnlineNum));
    });
    // 循环下线应用
    (function stopApp(i, stopList) {
      // 打开加载样式
      let spinning = _.cloneDeep(that.state.spinning);
      spinning[_.get(stopList, [i, 'appId'])] = true;
      that.setState({
        spinning
      });
      return that.props.stopApps({ clusterCode: clusterCode }, { appId: _.get(stopList, [i, 'appId'])})
      .then(()=>{
        // 改变下线成功的提示
        let isOfflineSuccess = _.cloneDeep(that.state.isOfflineSuccess);
        isOfflineSuccess[_.get(stopList, [i, 'appId'])] = true;
        // 关闭加载样式
        let spinning = _.cloneDeep(that.state.spinning);
        spinning[_.get(stopList, [i, 'appId'])] = false;
        that.setState({
          spinning,
          isOfflineSuccess
        });
        if(i < stopList.length-1){
          stopApp(i+1, stopList);
        } else {
          that.delelteApps(that);
        }
      })
      .catch((err)=>{
        console.log('offlineAppsError', err);
        let isOfflineFailed = _.cloneDeep(that.state.isOfflineFailed);
        let spinning = _.cloneDeep(that.state.spinning);
        isOfflineFailed[_.get(stopList, [i, 'appId'])] = true;
        spinning[_.get(stopList, [i, 'appId'])] = false;
        that.setState({
          spinning,
          isOfflineFailed
        });
        if(i < stopList.length-1){
          stopApp(i+1, stopList);
        }else{
          that.delelteApps(that);
        }
      })
    })(0, stopList)
  }
  handleCancel = () =>{
    this.setState({isClearing : false})
    this.props.onHide && this.props.onHide.call({});
  }
  setClearPolicy(data, keepOnlineNum, keepOfflineNum) {
    _.map(data, (value, key) => {
      let onlineList = value.filter((item, index) => {
        if(_.get(item, 'cluster[0].status') === 'online') return item;
      });
      let offlineList = value.filter((item, index) => {
        if(_.get(item, 'cluster[0].status') === 'offline') return item;
      });

      let keepOnlineIdx = onlineList.length - keepOnlineNum;
      let keepOfflineIdx = offlineList.length - keepOfflineNum;
      // 在线版本数未达到上限则全部保留
      if (keepOnlineIdx < 0) {
        keepOnlineIdx = 0;
      }
      onlineList.slice(keepOnlineIdx).map(d => {d.isKeepOnline = true; return d});
      if (keepOfflineIdx < 0) {
        keepOfflineIdx = 0;
      }
      offlineList.slice(keepOfflineIdx).map(d => {d.isKeepOffline = true; return d});
    });
    return data;
  }
  render() {
    let clearList = _.get(this, 'props.clearList') || [];
    let clusterCode = URL.parse(window.location.href, true).query.clusterCode;
    clearList = this.setClearPolicy(clearList, this.props.keepOnlineNum, this.props.keepOfflineNum);
    function colorChoose(value) {
      if (value === 'online' || value === 'success') return 'green';
      if (value === 'offline' || value === 'pending') return 'lightgray';
      if (value === 'fail' ) return 'red';
      return 'orange';
    }
    const columns = [{
      title: 'appId',
      dataIndex: 'appId',
      key: 'appId'
    }, {
      title: 'publish at',
      dataIndex: 'publishAt',
      key: 'publishAt'
    },{
      title: 'status',
      key: 'status',
      render: (text, record) => (
        !!this.state.isOfflineSuccess[record.appId] ?
          <Tag className='delete-all-status' color={colorChoose('offline')}>offline</Tag> :
          <Tag className='delete-all-status' color={colorChoose(record.cluster[0].status)}>{record.cluster[0].status}</Tag>
      )
    }, {
      title: '下线状态',
      key: 'isOffline',
      render: (text, record, index) => {
        let genDom = () => {
          if(record.isKeepOnline) return <span><Icon style={{fontSize: '16px'}} title='保留在线' type="lock" /></span>;
          if(record.isKeepOffline) return <span></span>;
          if(this.state.isOfflineSuccess[record.appId]) return <span style={{color:colorChoose('success')}}>下线成功</span>;
          if(this.state.isOfflineFailed[record.appId]) return <span style={{color: colorChoose('fail')}}>下线失败</span>;
          if(record.cluster[0].status === 'offline') return <span></span>
          return <span style={{color: colorChoose('pending')}}>待下线</span>;
        }
        return <div>
          <Spin spinning={!!this.state.spinning[record.appId]} size="small" />
          {!!!this.state.spinning[record.appId] ? genDom() : null}
        </div>
      }
    }, {
      title: '删除状态',
      key: 'isDelete',
      render: (text, record, index) => {
        let genDom = () => {
          if(this.state.isDeleteSuccess[record.appId]) return <span style={{color:colorChoose('success')}}>删除成功</span>;
          if(this.state.isDeleteFailed[record.appId]) return <span style={{color: colorChoose('fail')}}>删除失败</span>;
          if(record.isKeepOnline) return <span></span>;
          if(record.isKeepOffline) return <span><Icon style={{fontSize: '16px'}} title='保留服务' type="lock" /></span>;
          if(record.cluster[0].status === 'online') return <span></span>
          return <span style={{color: colorChoose('pending')}}>待删除</span>;
        }
        return <div>
          <Spin spinning={!!this.state.deleteSpinning[record.appId]} size="small" />
          {!!!this.state.deleteSpinning[record.appId] ? genDom() : null}
        </div>
      }
    }];
    return (
      <Modal
        title={'服务清理'}
        visible={this.props.visible}
        width={530}
        footer={
          <div>
            <Button disabled={this.state.isClearing} type="primary" onClick={this.handleOk.bind(this)}>清理</Button>
            <Button onClick={this.handleCancel}>关闭窗口{this.state.countDownNum && `(${this.state.countDownNum})`}</Button>
          </div>
        }
        onCancel={this.handleCancel}
        >
        <div className='delete-all-list online-list'>
          <div className='delete-all-subtitle'>
            <span>以下应用需要清理版本，点击“清理”会先下线再删除多余版本。</span>
          </div>
            {
              _.map(clearList, (value, key) => {
                return <Table key={key} size={'small'} pagination={false} columns={columns} dataSource={value} />
              })
            }
        </div>
      </Modal>
    )
  }
}

module.exports = OnlineListModal;
