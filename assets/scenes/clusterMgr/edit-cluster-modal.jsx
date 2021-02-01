'use strict';

var _ = require('lodash');
var React = require('react');
var antd = require('antd');
let classnames = require('classnames');
import {
  Modal,
  Button,
  Form,
  Input,
  Cascader,
  Select,
  Row,
  Col,
  Checkbox,
  Tooltip,
  Spin,
  Icon,
} from 'antd';
import {compose} from 'async';
const FormItem = Form.Item;
const Option = Select.Option;
const URL = require('url');
const ipRegex1 = /^(http[s]?)?:\/\/([\S])+/;
const ipRegex2 = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;

const tips = (
  <span>
    仅支持钉钉机器人，请参考
    <a target="_blank" href="https://www.yuque.com/honeycomb/honeycomb/ops-cluster#8yYlB">
      文档
    </a>
  </span>
);

class EditClusterModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      info: {},
      isIpsError: false,
    };
  }
  componentWillReceiveProps = (nextProps) => {
    if (!_.isEqual(nextProps.info, this.props.info)) {
      this.setState({
        info: _.cloneDeep(nextProps.info) || {},
      });
    }
  };
  handleOk = (e) => {
    let editInfo = _.cloneDeep(this.state.info);
    editInfo = _.assign({}, editInfo, {isUpdate: true});
    editInfo.ips = editInfo.ips.replace(/,/g, '\n').split(/\r?\n/);
    editInfo.ips = _.compact(editInfo.ips.map((item, index) => item.trim()));
    editInfo.ips = editInfo.ips.map((item) => item.replace(/\/$/g, ''));

    let errorIps = editInfo.ips.find((item, key) => {
      if (!item.match(ipRegex1) && !item.match(ipRegex2)) {
        return item;
      }
    });

    if (_.isEmpty(errorIps)) {
      this.setState({
        isIpsError: false,
      });
      if (!editInfo.token) {
        editInfo.token = '***honeycomb-default-token***';
      }
      if (!editInfo.endpoint) {
        editInfo.endpoint = 'http://' + editInfo.ips[0] + ':9999';
      }
      this.props.addCluster(editInfo).then(() => {
        this.props.getCluster();
        this.props.onHide && this.props.onHide.call({});
      });
    } else {
      this.setState({
        isIpsError: true,
      });
    }
  };

  handleCancel = (e) => {
    this.props.onHide && this.props.onHide.call({});
  };

  onClusterInfoChange = function (name, value) {
    let editInfo = _.cloneDeep(this.state.info) || {};

    // 兼容 Input 和 Select 的 onChange 回调入参
    if (typeof value === 'string') {
      editInfo[name] = value;
    } else {
      editInfo[name] = _.get(value, 'target.value');
    }

    this.setState({info: editInfo});
  };

  render() {
    const formItemLayout = {
      labelCol: {span: 6},
      wrapperCol: {span: 14},
    };
    let clusterMeta = this.state.info;
    if (_.isArray(clusterMeta.ips)) {
      clusterMeta.ips = clusterMeta.ips.join('\n');
    }

    return (
      <div>
        <Modal
          title="编辑集群"
          visible={this.props.visible}
          onCancel={this.handleCancel}
          footer={
            <div>
              <Button size="large" onClick={this.handleCancel}>
                取消
              </Button>
              <Button size="large" onClick={this.handleOk} type="primary">
                提交
              </Button>
            </div>
          }
        >
          <Form>
            <FormItem {...formItemLayout} label="集群中文名(name):">
              <Input
                onChange={this.onClusterInfoChange.bind(this, 'name')}
                value={clusterMeta.name}
              />
            </FormItem>
            <FormItem {...formItemLayout} label="集群英文名(code):">
              <Input disabled value={clusterMeta.code} />
            </FormItem>
            <FormItem {...formItemLayout} label="endpoint:">
              <Input
                onChange={this.onClusterInfoChange.bind(this, 'endpoint')}
                value={clusterMeta.endpoint}
              />
            </FormItem>
            <FormItem {...formItemLayout} label="token:">
              <Input
                type="password"
                onChange={this.onClusterInfoChange.bind(this, 'token')}
                value={clusterMeta.token}
              />
            </FormItem>
            <FormItem {...formItemLayout} label="ip 列表:">
              <Input
                className={classnames({'ips-error': this.state.isIpsError})}
                onChange={this.onClusterInfoChange.bind(this, 'ips')}
                type="textarea"
                rows={4}
                value={clusterMeta.ips}
              />
            </FormItem>
            <FormItem {...formItemLayout} label="集群环境">
              <Select
                value={this.state.info.env}
                onChange={this.onClusterInfoChange.bind(this, 'env')}
              >
                <Option value="dev">开发(dev)</Option>
                <Option value="pre">预发(pre)</Option>
                <Option value="prod">生产(prod)</Option>
              </Select>
            </FormItem>
            <FormItem
              {...formItemLayout}
              label="集群监控"
              help={tips}
            >
              <Input
                onChange={this.onClusterInfoChange.bind(this, 'monitor')}
                value={clusterMeta.monitor}
              />
            </FormItem>
          </Form>
        </Modal>
      </div>
    );
  }
}
module.exports = EditClusterModal;
