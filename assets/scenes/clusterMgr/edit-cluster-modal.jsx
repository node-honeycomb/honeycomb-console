'use strict';

var _ = require("lodash");
var React = require('react');
var antd = require('antd');
let classnames = require('classnames');
import { Modal, Button, Form, Input, Cascader,Select, Row, Col, Checkbox, Tooltip, Spin, Icon} from 'antd';
const FormItem = Form.Item;
const Option = Select.Option;
const URL = require("url");
class EditClusterModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      info:{},
      isIpsError: false
    }
  }
  componentWillReceiveProps = (nextProps) => {
    if (!_.isEqual(nextProps.info, this.props.info)) {
      this.setState({
        info: _.cloneDeep(nextProps.info) || {}
      });
    }
  }
  handleOk = (e) => {
    let editInfo = _.cloneDeep(this.state.info);
    editInfo = _.assign({},editInfo,{isUpdate:true});
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
      })
    }else{
      this.setState({
        isIpsError: true
      })
    }
  }
  handleCancel = (e) => {
    this.props.onHide && this.props.onHide.call({});
  }
  onClusterInfoChange = function(name, value){
    let editInfo = _.cloneDeep(this.state.info) || {};
    editInfo[name] = value.target.value;
    this.setState({info: editInfo});
  }
  render(){
    const formItemLayout = {
      labelCol: { span: 6 },
      wrapperCol: { span: 14 },
    };
    let clusterMeta = this.state.info;
    if (_.isArray(clusterMeta.ips)) {
      clusterMeta.ips = clusterMeta.ips.join('\n');
    }
    return (
      <div>
        <Modal title="编辑集群" visible={this.props.visible}
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
              <Input onChange={this.onClusterInfoChange.bind(this,"name")} value={clusterMeta.name} />
            </FormItem>
            <FormItem
              {...formItemLayout}
              label="集群英文名(code):"
              >
              <Input disabled value={clusterMeta.code} />
            </FormItem>
            <FormItem
              {...formItemLayout}
              label="endpoint:"
              >
              <Input onChange={this.onClusterInfoChange.bind(this,"endpoint")} value={clusterMeta.endpoint} />
            </FormItem>
            <FormItem
              {...formItemLayout}
              label="token:"
              >
              <Input type="password" onChange={this.onClusterInfoChange.bind(this,"token")} value={clusterMeta.token} />
            </FormItem>
            <FormItem
              {...formItemLayout}
              label="ip 列表:"
              >
              <Input className={classnames({'ips-error': this.state.isIpsError})} onChange={this.onClusterInfoChange.bind(this, "ips")} type="textarea" rows={4} value={clusterMeta.ips} />
            </FormItem>
          </Form>
        </Modal>
      </div>
    );
  }
}
module.exports = EditClusterModal;
