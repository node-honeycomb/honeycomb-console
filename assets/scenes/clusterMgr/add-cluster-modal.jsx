'use strict';

var _ = require("lodash");
var React = require('react');
var antd = require('antd');
let classnames = require('classnames');
import { Modal, Button, Form, Input, Cascader,Select, Row, Col, Checkbox, Tooltip, Spin, Icon} from 'antd';
const FormItem = Form.Item;
const Option = Select.Option;
const ipRegex1 = /^(http[s]?)?:\/\/([\S])+/;
const ipRegex2 = /(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])([\S])+$/;
class AddClusterModal extends React.Component {
  state = {
    info: {
      code:'',
      endpoint:'',
      ips:[],
      name:'',
      token:''
    }
  }
  onClusterInfoChange = function(name, value){
    let editInfo = _.cloneDeep(this.state.info);
    editInfo[name] = value.target.value;
    this.setState({info: editInfo});
  }
  handleOk = (e) => {
    let editInfo = _.cloneDeep(this.state.info);
    editInfo.isUpdate = false;
    if(typeof editInfo.ips === 'string'){
      editInfo.ips = editInfo.ips.replace(/,/g, '\n').split(/\r?\n/g);
      editInfo.ips =  _.compact(editInfo.ips.map((item, index) => item.trim()));
      editInfo.ips = editInfo.ips.map(item => item.replace(/\/$/g, ''));
    }
    if(editInfo.ips.length === 0){
      this.setState({
        isIpsError: true
      });
      return;
    }
    let errorIps = editInfo.ips.find((item, key) => {
      if(!item.match(ipRegex1) && !item.match(ipRegex2)){
        return item;
      }
    });
    if(!_.isEmpty(errorIps)){
      this.setState({
        isIpsError: true
      });
      return;
    }
    if (!editInfo.token) {
      editInfo.token = '***honeycomb-default-token***';
    }
    if (!editInfo.endpoint) {
      editInfo.endpoint = 'http://' + editInfo.ips[0] + ':9999';
    }

    this.setState({
      isIpsError: false
    })
    this.props.addCluster(editInfo).then(() => {
      this.props.getCluster();
      this.props.onHide && this.props.onHide.call({});
      this.setState({info:{}});
    });


  }
  handleCancel = (e) => {
    this.props.onHide && this.props.onHide.call({});
    this.setState({info:{}});
  }
  render(){
    const formItemLayout = {
      labelCol: { span: 6 },
      wrapperCol: { span: 14 },
    };
    return (
      <div>
        <Modal title="新建集群" visible={this.props.visible}
          onCancel={this.handleCancel}
          footer={
            <div>
              <Button size="large" onClick={this.handleCancel}>取消</Button>
              <Button size="large" onClick={this.handleOk} type="primary">提交</Button>
            </div>
          }
        >
          <Form>
            <FormItem
              {...formItemLayout}
              label="集群显示名:"
              >
              <Input onChange={this.onClusterInfoChange.bind(this,"name")} value={this.state.info.name} placeholder="请填写集群显示名" />
            </FormItem>
            <FormItem
              {...formItemLayout}
              label="集群Code:"
              >
              <Input onChange={this.onClusterInfoChange.bind(this,"code")} value={this.state.info.code} placeholder="请填写集群Code，英文字母" />
            </FormItem>
            <FormItem
              {...formItemLayout}
              label="endpoint:"
              >
              <Input onChange={this.onClusterInfoChange.bind(this,"endpoint")} value={this.state.info.endpoint} placeholder="集群中任意一台机器都可以, 格式: 'http://$ip:9999'" />
            </FormItem>
            <FormItem
              {...formItemLayout}
              label="token:"
              >
              <Input onChange={this.onClusterInfoChange.bind(this,"token")} value={this.state.info.token} placeholder="请填写token，来自server.config.admin.token" />
            </FormItem>
            <FormItem
              {...formItemLayout}
              label="ip 列表:"
              >
              <Input className={classnames({'ips-error': this.state.isIpsError})} onChange={this.onClusterInfoChange.bind(this,"ips")} value={this.state.info.ips} type="textarea" rows={4} placeholder="集群机器的ip列表，每行一个或逗号间隔" />
            </FormItem>
            <p>注：新安装的honeycomb-server，token默认值为: ***honeycomb-default-token***</p>
          </Form>
        </Modal>
      </div>
    );
  }
}
module.exports = AddClusterModal;
