'use strict';

var _ = require("lodash");
var React = require('react');
var antd = require('antd');
let classnames = require('classnames');
import { Modal, Button, Form, Input, Cascader,Select, Row, Col, Checkbox, Tooltip, Spin, Icon} from 'antd';
const FormItem = Form.Item;
const Option = Select.Option;
class AddClusterModal extends React.Component {
  state = {
    info: {
      code:'',
      endpoint:'',
      ips:[],
      name:'',
      token:'',
    },
  }
  onClusterInfoChange = function(name, value){
    let editInfo = _.cloneDeep(this.state.info) || {};
    editInfo[name] = value.target.value;
    this.setState({info: editInfo});
  }
  handleOk = (e) => {
    let editInfo = _.cloneDeep(this.state.info);
    editInfo = _.assign({},editInfo,{isUpdate:false});
    editInfo.ips = editInfo.ips.replace(/,/g, '\n').split(/\r?\n/);
    editInfo.ips =  _.compact(editInfo.ips.map((item, index)=> item.trim()));
    let errorIps = editInfo.ips.find((item, key)=>{
      if(!item.match('^[0-9a-zA-Z\.\\?]+$')){
        return item;
      }
    })
    if(_.isEmpty(errorIps)){
      this.setState({
        isIpsError: false
      })
      this.props.addCluster(editInfo).then(()=>{
        this.props.onHide && this.props.onHide.call({});
        this.setState({info:{}});
      })
    }else{
      this.setState({
        isIpsError: true
      })
    }
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
              label="集群中文名(name):"
              >
              <Input onChange={this.onClusterInfoChange.bind(this,"name")} value={this.state.info.name} placeholder="请填写集群中文名" />
            </FormItem>
            <FormItem
              {...formItemLayout}
              label="集群英文名(code):"
              >
              <Input onChange={this.onClusterInfoChange.bind(this,"code")} value={this.state.info.code} placeholder="请填写集群英文名" />
            </FormItem>
            <FormItem
              {...formItemLayout}
              label="endpoint:"
              >
              <Input onChange={this.onClusterInfoChange.bind(this,"endpoint")} value={this.state.info.endpoint} placeholder="请填写endpoint" />
            </FormItem>
            <FormItem
              {...formItemLayout}
              label="token:"
              >
              <Input onChange={this.onClusterInfoChange.bind(this,"token")} value={this.state.info.token} placeholder="请填写token" />
            </FormItem>
            <FormItem
              {...formItemLayout}
              label="ip 列表:"
              >
              <Input className={classnames({'ips-error': this.state.isIpsError})} onChange={this.onClusterInfoChange.bind(this,"ips")} value={this.state.info.ips} type="textarea" rows={4} placeholder="请填写ip列表" />
            </FormItem>
          </Form>
        </Modal>
      </div>
    );
  }
}
module.exports = AddClusterModal;
