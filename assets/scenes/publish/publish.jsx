'use strict';

var React = require('react');
let connect = require('react-redux').connect;
let classnames = require('classnames');
import { Modal, Button, Table, Icon, Tag, Input, Upload, message, Form, Tabs, Card, Col, Row , notification } from 'antd';
const FormItem = Form.Item;
const confirm = Modal.confirm;
const TabPane = Tabs.TabPane
require('./publish.less');
import { RouteContext } from 'react-router';
const URL = require("url");

class Publish extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
    visible: false,
    info:{},
    fileList:[]
    }
  }
  showAddPublishModal = () =>{
    this.setState({
      visible: true,
    });
  }
  handleOk = (e) => {
    let newState = _.cloneDeep(this.state) || {};
    let clusterCode = URL.parse(window.location.href, true).query.clusterCode;
    let param = _.assign({},newState.info,{clusterCode:clusterCode})
    this.props.addWorker(param).then(()=>{
      this.setState({
        visible: false,
      });
    }).catch((err)=>{
      message.error(err)
      this.setState({
        visible: false,
      });
    })

  }
  handleCancel = (e) => {
    this.setState({
      visible: false,
    });
  }
  addIp = (e) =>{
    let info = {ip:e.target.value}
    this.setState({info:info});
  }
  render() {
    let clusterCode = URL.parse(window.location.href, true).query.clusterCode;
    let ips = [];
    let that = this;
    var props = {
      name: 'pkg',
      action: window.prefix + '/api/app/publish?clusterCode='+clusterCode+'&_csrf='+window.csrfToken,
      beforeUpload(file,fileList) {
        return new Promise((resolve, reject) => {
          Modal.confirm({
            title:'发布应用',
            content:(
              <div className="publish-modal-content">
                <p>您确定要发布 <span>{file.name}</span> 到 <span>{URL.parse(window.location.href, true).query.clusterCode}</span> 吗？</p>
              </div>
            ),
            okText:'开始发布',
            cancelText:'取消发布',
            onOk() {
              return resolve(file);
            },
            onCancel() {
              return false;
            },
          })
        })

      },
      onChange(info) {
        if (info.file.status !== 'uploading') {
          console.log(info.file, info.fileList);
        }
        if (info.file.status === 'done') {
          if(info.file.response.data.success.length > 0){
            message.success(info.file.name + ' 发布成功。');
            that.context.router.push({
              pathname: '/pages/list?clusterCode='+ clusterCode,
            })
          }else if(info.file.response.data.error.length > 0){
            notification['error']({
              message: '发布失败 ip:'+ info.file.response.data.error[0].ip,
              description: JSON.stringify(info.file.response.data.error[0].message),
              duration: null
            });
          }
        } else if (info.file.status === 'error') {
          message.error(info.file.name + ' 发布失败。');
          notification['error']({
            message: '发布失败 ip:'+ info.file.name,
            description: JSON.stringify(info.file.response.message),
            duration: null
          });
        }
      }
    };
    const formItemLayout = {
      labelCol: { span: 6 },
      wrapperCol: { span: 14 },
    };

    let tagSwitch = (window.ENV === "dev") || (window.ENV === "daily");

    let ipStatus = [];
    let rowNum = "";
    if(!!!_.isEmpty(this.props.appMeta.status)){
      ipStatus = this.props.appMeta.status;
      ipStatus = _.chunk(ipStatus, 4);
    }

    let publishTabs = [];
    if (window.publishPages && window.publishPages.length > 0) {
      let tabs = window.publishPages.map((publishPage, pageIndex) => {
        return (
          <TabPane tab={publishPage.tabName} key={pageIndex + 1}>
            <div className={'iframe ' + publishPage.className}>
              <iframe src={publishPage.src + '?clusterCode=' + clusterCode}/>
            </div>
          </TabPane>
          );
      });
      publishTabs = publishTabs.concat(tabs);
    }
    publishTabs.push(
    <TabPane tab="手动发布" key={publishTabs.length + 1}>
    <div className="publish-update">
      <Upload {...props}>
        <button type="button" className="ant-btn ant-btn-ghost">
          <i className="anticon anticon-upload"></i> 发布应用
        </button>
      </Upload>
    </div>
    <div className="publish-list">
      <div className="app-status-wrap">
      {
        ipStatus.map((item, index)=>{
          return(
            <row key={index}>
              {
                item.map((value, key)=>{
                   return(
                  <Col key={key} span={6}>
                    <Card title={"机器："+value.ip} >
                      {
                        _.map(value.data, (v, k)=>{
                          return(
                            <p key={k}>{k} : {v}</p>
                          )
                        })
                      }
                    </Card>
                  </Col>
                  )
                })
              }
            </row>
          )
        })
      }
      </div>
    </div>
  </TabPane>);
    return(
      <div className="publish-wrap">
        <Tabs className="tab-wrap" defaultActiveKey={'1'}>
          {publishTabs}
        </Tabs>
      </div>
    )
  }
}

let mapStateToProps = (store) => {
  let publishMeta = store.publish;
  let appMeta = store.app;
  return {
    publishMeta,
    appMeta
  }
}
Publish.contextTypes = {
  router: React.PropTypes.object
}
let actions = require("../../actions");

module.exports = connect(mapStateToProps,{
  removeWorker:actions.publish.removeWorker,
  addWorker:actions.publish.addWorker,
  getStatus:actions.app.getStatus
})(Publish);
