'use strict';

var _ = require("lodash");
var React = require('react');
var antd = require('antd');
let connect = require('react-redux').connect;
let classnames = require('classnames');
let ReactDom = require('react-dom');
import { Modal, Button, Icon, Table, Tag } from 'antd';
const confirm = Modal.confirm;
const URL = require("url");

class OnlineListModal extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      isOfflineSuccess:{},
      isOfflineFailed:{}
    }
  }
  handleOk = () => {
    let onlineList = _.get(this, 'props.onlineList') || [];
    let stopList = []
    onlineList.map(d => {
      stopList = _.concat(stopList, _.slice(d, 0, d.length-2))
    })
    let clusterCode = URL.parse(window.location.href, true).query.clusterCode;
    let that = this;
    (function stopApp(i, stopList) {
      return that.props.stopApps({ clusterCode: clusterCode }, { appId: stopList[i].appId})
      .then(()=>{
        let isOfflineSuccess = _.cloneDeep(that.state.isOfflineSuccess);
        isOfflineSuccess[stopList[i].appId] = true;
        that.setState({
          isOfflineSuccess: isOfflineSuccess
        });
        if(i < stopList.length-1){
          stopApp(i+1, stopList);
        }else {
          that.props.onHide && that.props.onHide.call({});
        }
      })
      .catch((err)=>{
        let isOfflineFailed = _.cloneDeep(that.state.isOfflineFailed);
        isOfflineFailed[stopList[i].appId] = true;
        that.setState({
          isOfflineFailed: isOfflineFailed
        });
        if(i < stopList.length-1){
          stopApp(i+1, stopList);
        }else {
          that.props.onHide && that.props.onHide.call({});
        }
      })
    })(0, stopList)
  }

  render() {
    //const appName = this.props.deleteAppName;
    let onlineList = _.get(this, 'props.onlineList') || [];
    let clusterCode = URL.parse(window.location.href, true).query.clusterCode;
    //除去最新的2个在线版本

    function colorChoose(value) {
      let color = value === 'online'
      ? "green"
      : value === 'offline'
        ? "lightgray"
        : "orange"
      return color;
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
        <Tag className='delete-all-status' color={colorChoose(record.cluster[0].status)}>{record.cluster[0].status}</Tag>
      )
    }, {
      title: 'isOffline',
      key: 'isOffline',
      render: (text, record) => (
        <div>
          <Icon
            className={classnames({
              'delete-color-success': true,
              'delete-icon': !this.state.isOfflineSuccess[record.appId],
            })}
            type="check-circle-o" />
            <Icon
            className={classnames({
              'delete-color-failed': true,
              'delete-icon': !this.state.isOfflineFailed[record.appId],
            })}
            type="close-circle-o" />
        </div>
      )
    }];
    return (
      <Modal
        title={'批量下线'}
        visible={this.props.visible}
        footer={
          <div>
            <Button type="primary" ghost onClick={this.handleOk.bind(this)}>批量下线</Button>
          </div>
        }
        closable={false}
        >
        <div className='delete-all-list'>
          <div className='delete-all-subtitle'>
            <span>以下应用在线版过多，请先下线无用版本。</span>
            <span>(策略：点击‘批量下线’只会保留<span className='delete-all-yellow'>最新的两个在线版本</span>，其余版本会自动下线）</span>
          </div>
          {
            onlineList.map((d, index) => {
              return <Table key={index} size={'small'} pagination={false} columns={columns} dataSource={d} />
            })
          }
        </div>
      </Modal>
    )
  }
}

module.exports = OnlineListModal;
