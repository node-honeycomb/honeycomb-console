'use strict';

var _ = require("lodash");
var React = require('react');
var antd = require('antd');
let connect = require('react-redux').connect;
let classnames = require('classnames');
let ReactDom = require('react-dom');
import { Modal, Button, Icon, Table, Tag, Tooltip } from 'antd';
const confirm = Modal.confirm;
const URL = require("url");

class DeleteAllModal extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      isDeleteSuccess:{},
      isDeleteFailed:{},
      isClearing:false
    }
  }
  handleOk = (deleteList) => {
    let clusterCode = URL.parse(window.location.href, true).query.clusterCode;
    let that = this;
    this.setState({isClearing : true});
    (function deleteApp(i, deleteList) {
      return that.props.deleteApps({ clusterCode: clusterCode }, { appId: deleteList[i].appId})
      .then(()=>{
        let isDeleteSuccess = _.cloneDeep(that.state.isDeleteSuccess);
        isDeleteSuccess[deleteList[i].appId] = true;
        that.setState({
          isDeleteSuccess: isDeleteSuccess
        });
        i++;
        if(i < deleteList.length){
          deleteApp(i, deleteList);
        }
      })
      .catch((err)=>{
        let isDeleteFailed = _.cloneDeep(that.state.isDeleteFailed);
        isDeleteFailed[deleteList[i].appId] = true;
        that.setState({
          isDeleteFailed: isDeleteFailed,
          isClearing : false
        });
      })
    })(0, deleteList)
  }
  handleCancel = () =>{
    this.setState({isClearing : false})
    this.props.onHide && this.props.onHide.call({});
  }
  render() {
    const appName = this.props.deleteAppName;
    let clusterCode = URL.parse(window.location.href, true).query.clusterCode;
    //全版本列表
    let showList = _.get(this.props.filterList,[appName, 'show']);
    //除去最新的3个版本的列表
    let oldList = _.differenceBy(showList, _.get(this.props.filterList,[appName, 'lastThree']), 'appId');
    //停用oldList列表中offline的版本
    let deleteList = oldList.filter((v,k)=>{return v.cluster[0].status === 'offline'});
    //所有保留版本
    let protectedList = _.differenceBy(showList, deleteList, 'appId');
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
      key: 'appId',
      render: (text, record) => {
        let isProtected = _.find(protectedList, (value, key)=> value.appId === record.appId);
        return <div className={classnames({'protected-wrap': isProtected})}>
          { isProtected
          ?(<Tooltip placement="right" title={'保留版本'}>
              <Icon style={{fontSize: '16px', marginRight: '5px'}} type="lock" />
              {text}
            </Tooltip>)
          : text}
        </div>
      }
    }, {
      title: 'status',
      key: 'status',
      render: (text, record) => (
        <Tag className='delete-all-status' color={colorChoose(record.cluster[0].status)}>{record.cluster[0].status}</Tag>
      )
    }, {
      title: 'isDelete',
      key: 'isDelete',
      render: (text, record) => (
        <div>
          <Icon
            className={classnames({
              'delete-color-success': true,
              'delete-icon': !this.state.isDeleteSuccess[record.appId],
            })}
            type="check-circle-o" />
            <Icon
            className={classnames({
              'delete-color-failed': true,
              'delete-icon': !this.state.isDeleteFailed[record.appId],
            })}
            type="close-circle-o" />
        </div>
      )
    }];
    return (
      <Modal
        title={'确定要删除'+this.props.deleteAppName+'的以下版本吗?'}
        visible={this.props.visible}
        footer={
          <div>
            <Button disabled={this.state.isClearing} type="danger" ghost onClick={this.handleOk.bind(this, deleteList)}>批量清理</Button>
            <Button type="primary" ghost onClick={this.handleCancel}>关闭窗口</Button>
          </div>
        }
        closable={false}
        >
        <div className='delete-all-list'>
          <div className='delete-all-subtitle'>
          保留<span className='delete-all-yellow'>最新3个和所有在线版本</span>，其余所有<span className='delete-all-yellow'>下线版本</span>将会被删除。
          </div>
          <Table size={'small'} pagination={false} columns={columns} dataSource={showList} />
          <div className='delete-all-font delete-all-red'>
            请核对以上版本，批量删除无法复原，请谨慎操作
          </div>
        </div>
      </Modal>
    )
  }
}

module.exports = DeleteAllModal;
