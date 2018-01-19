'use strict';

var _ = require("lodash");
var React = require('react');
var antd = require('antd');
let connect = require('react-redux').connect;
let classnames = require('classnames');
let moment = require('moment');
let ReactDom = require('react-dom');
import { Modal, Button, Icon, Table } from 'antd';
const confirm = Modal.confirm;
require('./list.less');
import { RouteContext } from 'react-router';
const URL = require("url");
class ErrorMsgModal extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
    }
  }
  handleOk = (e) => {
    this.props.onHide && this.props.onHide.call({});
  }
  handleCancel = (e) => {
    let clusterCode = URL.parse(window.location.href, true).query.clusterCode;
    let appid = this.props.name+'_'+this.props.version;
    let that = this;
    confirm({
      title: "确定要清空抛错记录(ExitRecord)吗？",
      content: "无法复原，请谨慎操作",
      onOk() {
        that.props.cleanAppExitRecord({clusterCode: clusterCode},{appid: appid}).then(()=>{
          that.props.onHide && that.props.onHide.call({});
        })
      },
      onCancel() {},
    });
  }
  linkToLog = (data)=>{
    let clusterCode = URL.parse(window.location.href, true).query.clusterCode;
    let message = {
      clusterCode
    }
    let _data = data.timeMsg.split(" ");
    if(_data.length > 1){
      message = {
        ip: data.ip,
        date: _data[0],
        time: _data[1],
        name: this.props.name,
        clusterCode
      }
    }
    this.context.router.push({
      pathname: '/pages/log',
      query: message,
    })
  }
  render() {
    let message = this.props.message;
    let msg = [];
    let msgString = [];
    let data = {};
    if (Array.isArray(message)) {
      message.forEach(function(m) {
        if (typeof m === 'object') {
          m.errorExitRecord.forEach(function (e) {
            let _obj = {
              time: e,
              timeMsg: moment(e).format('YYYY-MM-DD HH:mm:ss'),
              ip :  m.ip,
            }
            msg.push(_obj);
          })
        } else {
          msgString.push( m + '  worker die!');
        }
      });
      msg = _.sortBy(msg, function(item) {
        return -(new Date(item.time).getTime());
      });
    } 
    let columns = [{
        title: '机器IP',
        dataIndex: 'ip',
        key: 'ip'
      }, {
        title: '抛错时间',
        key: 'timeMsg',
        dataIndex: 'timeMsg',
        render: (text, record) => (
          text
        )
      }, {
        title: '详情',
        key: 'detail',
        render: (text, record) => (
          <a onClick={this.linkToLog.bind(this, record)}><Icon type="file-text" /></a>
        )
    }]
    return (
      <div>
        <Modal title={"当前服务"+ this.props.appId +"曾发生异常，请注意！"} visible={this.props.visible}
        footer={
          <div>
            <Button type="danger" ghost onClick={this.handleCancel}>清空记录</Button>
            <Button type="primary" ghost onClick={this.handleOk}>关闭窗口</Button>
          </div> 
        } closable={false} width={500}>
          <div className='error-msg-modal'>
            <p>服务发生异常的机器ip和时间点如下， 请点击详情查看</p>
            <Table size={'small'} pagination={false} columns={columns} dataSource={msg} />
            {!_.isEmpty(msgString)
            ? (<div className='error-msg-wrap'>
                <p>服务发生异常信息如下，请自行检查或者联系项目管理员</p>
               { msgString.map((item,index)=>{
                  return(
                    <p key={index}>{item}</p>
                  )
                })}
              </div>)
            : null}
          </div>
        </Modal>
      </div>
    )
  }
}
ErrorMsgModal.contextTypes = {
  router: React.PropTypes.object
}
module.exports = ErrorMsgModal;
