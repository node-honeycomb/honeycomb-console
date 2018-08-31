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
      spinning: {}
    }
  }
  handleOk = () => {
    let onlineList = _.get(this, 'props.onlineList') || [];
    let stopList = [];
    this.setState({isClearing : true});
    onlineList.map(d => {
      stopList = _.concat(stopList, _.slice(d, 0, d.length-1))
    })
    let clusterCode = URL.parse(window.location.href, true).query.clusterCode;
    this.setState({isClearing : true});
    let that = this;
    (function stopApp(i, stopList) {
      let spinning = _.cloneDeep(that.state.spinning);
      spinning[stopList[i].appId] = true;
      that.setState({
        spinning
      });
      return that.props.stopApps({ clusterCode: clusterCode }, { appId: stopList[i].appId})
      .then(()=>{
        let isOfflineSuccess = _.cloneDeep(that.state.isOfflineSuccess);
        let spinning = _.cloneDeep(that.state.spinning);
        isOfflineSuccess[stopList[i].appId] = true;
        spinning[stopList[i].appId] = false;
        that.setState({
          isOfflineSuccess,
          spinning
        });
        if(i < stopList.length-1){
          stopApp(i+1, stopList);
        }
      })
      .catch((err)=>{
        let isOfflineFailed = _.cloneDeep(that.state.isOfflineFailed);
        let spinning = _.cloneDeep(that.state.spinning);
        isOfflineFailed[stopList[i].appId] = true;
        spinning[stopList[i].appId] = false;
        that.setState({
          isOfflineFailed,
          isClearing : false,
          spinning
        });
        if(i < stopList.length-1){
          stopApp(i+1, stopList);
        }
      })
    })(0, stopList)
  }
  handleCancel = () =>{
    this.setState({isClearing : false})
    this.props.onHide && this.props.onHide.call({});
  }
  render() {
    let onlineList = _.get(this, 'props.onlineList') || [];
    let clusterCode = URL.parse(window.location.href, true).query.clusterCode;

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
      title: 'isOffline',
      key: 'isOffline',
      render: (text, record, index) => {
        let genDom = () => {
          if(record.isSave) return <span>保留</span>;
          if(this.state.isOfflineSuccess[record.appId]) return <span style={{color:colorChoose('success')}}>下线成功</span>;
          if(this.state.isOfflineFailed[record.appId]) return <span style={{color: colorChoose('fail')}}>下线失败</span>;
          return <span style={{color: colorChoose('pending')}}>待下线</span>;
        }
        return <div>
          <Spin spinning={!!this.state.spinning[record.appId]} size="small" />
          {!!!this.state.spinning[record.appId] ? genDom() : null}
        </div>
      }
    }];
    return (
      <Modal
        title={'批量下线'}
        visible={this.props.visible}
        footer={
          <div>
            <Button disabled={this.state.isClearing} type="primary" onClick={this.handleOk.bind(this)}>批量下线</Button>
            <Button onClick={this.handleCancel}>关闭窗口</Button>
          </div>
        }
        onCancel={this.handleCancel}
        >
        <div className='delete-all-list online-list'>
          <div className='delete-all-subtitle'>
            <span>以下应用在线版过多，请先下线无用版本。</span>
            <span>(策略：点击‘批量下线’只会保留<span className='delete-all-yellow'>最新的一个在线版本</span>，其余版本会自动下线）</span>
          </div>
          {
            onlineList.map((d, index) => {
              let  _d = _.cloneDeep(d);
              _.last(_d).isSave = true;
              return <Table key={index} size={'small'} pagination={false} columns={columns} dataSource={_d} />
            })
          }
        </div>
      </Modal>
    )
  }
}

module.exports = OnlineListModal;
