'use strict';

var React = require('react');
let connect = require('react-redux').connect;
let classnames = require('classnames');
import { Modal, Button, Table, Icon, Tag, Select, Input, Popconfirm, message, Spin } from 'antd';
const Option = Select.Option;
const ClusterSelector = require('./clusterSelector.jsx');
require('./acl.less');  
var lodash = require('lodash');
const URL = require("url");

class EditableCell extends React.Component {
constructor(props) {
  super(props);
  this.state = {
      value: this.props.value,
      editable: this.props.editable || false,
    };
  }
  handleChange(e) {
    const value = e.target.value;
    this.setState({ value });
    this.props.onChange(value);
  }
  render() {

    return (
      <div>
        {
          true ?
            <div>
              <Input
                value={this.props.value}
                onChange={e => this.handleChange(e)}
              />
            </div>
            :
            <div className="editable-row-text">
              {value.toString() || ' '}
            </div>
        }
      </div>
    );
  }
}

var clusterTableColumns = [{
  title: '集群',
  dataIndex: 'cluster_code',
  render: (text, record, index) => {
    return record.cluster_code + " - "+ record.cluster_name;
  }
}];

class Acl extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.columns = [
      {
        title: 'Name',
        dataIndex: 'name',
        render: (text, record, index) => {
            return this.renderColumns(record, index, 'name', text);
        }
      },
      {
          title: 'Role',
          dataIndex: 'cluster_admin',
          render: (text, record, index) => {
            var self = this;
            return (
                <Select value={text+''} style={{ width: 120 }} onChange={(value) => {
                  self.handleChange('cluster_admin', index, value.toString());
                }}>
                  <Option value="1">Admin</Option>
                  <Option value="0">User</Option>
                </Select>
              );
        }
      },
      {
        title: '拥有的APP',
        dataIndex: 'apps',
        render: (text, record, index) => {
          if (text) text = JSON.parse(text);
          return (<Select
            allowClear={true}
            mode="tags"
            size="large"
            placeholder="Please select"
            value={text||[]}
            onChange={value => this.handleChange('apps', index, JSON.stringify(value))}
            style={{ 'width': '500px' }}
          >
            {
              this.state.appList.map((app) => {
                if (app === '*') return <Option key={'*'}>{'*(所有 APP)'}</Option>;
                return <Option key={app}>{app}</Option>;
              })
            }
          </Select>);
        }
      }, 
      {
        title: '操作',
        dataIndex: 'operation',
        width: '20%',
        render: (text, record, index) => {
          if (record.id === -1) {
            return (
              <div className="editable-row-operations">
                <span>
                  <Popconfirm title="确认保存?" onConfirm={() => this.create(index)}>
                    <a>保存</a>
                  </Popconfirm>
                  &nbsp;&nbsp;&nbsp;
                  <Popconfirm title="确认撤销?" onConfirm={() => this.delete(index)}>
                    <a>撤销</a>
                  </Popconfirm>
                </span>
              </div>
            );
          }

          return (
            <div className="editable-row-operations">
              {
                  <span>
                    <Popconfirm title="确认保存?" onConfirm={() => this.update(index)}>
                      <a>保存</a>
                    </Popconfirm>
                    &nbsp;&nbsp;&nbsp;
                    <Popconfirm title="确认删除?" onConfirm={() => this.serverDelete(index)}>
                      <a>删除</a>
                    </Popconfirm>
                  </span>
              }
            </div>
          );
        },
      }
    ];
    var selectedCluster = lodash.cloneDeep(props.acl.meta[0]);
    for (var i = 0; i < props.acl.meta.length; i++) {
      if (props.acl.meta[i].cluster_code === window.localStorage.clusterCode) {
        selectedCluster = props.acl.meta[i];
      }
    }
    var appList = props.app && props.app.filterList;
    if (appList && typeof appList === 'object') {
      appList = Object.keys(appList);
      appList.unshift('*');
    }

    this.state = {
      selectedCluster: selectedCluster,
      appList: appList
    };

    this.changeCluster = this.changeCluster.bind(this);
    this.addAcl = this.addAcl.bind(this);
  }
  componentWillReceiveProps(nextProps) {
    var aclMeta = lodash.cloneDeep(nextProps.acl.meta);
    var appList = lodash.cloneDeep(nextProps.app.filterList);
    if (appList && typeof appList === 'object') {
      appList = Object.keys(appList);
      appList.unshift('*');
    }
    var selectedCluster = lodash.cloneDeep(this.state.selectedCluster);
    if (aclMeta && aclMeta.length > 0) {
      if (!selectedCluster) {
        selectedCluster = aclMeta[0];
        for (var i = 0; i < aclMeta.length; i++) {
          if (aclMeta[i].cluster_code === window.localStorage.clusterCode) {
            selectedCluster = aclMeta[i];
          }
        }
      }
      this.setState({
        selectedCluster: selectedCluster,
        aclMeta: aclMeta,
        appList: appList
      });
    }
  }
  renderColumns(record, index, key, text) {
    var status = 'save';
    var editable = false;
    if (key !== 'id')
      editable = true;

    if (typeof editable === 'undefined') {
      return text;
    }
    return (<EditableCell
      editable={editable}
      value={text}
      onChange={value => this.handleChange(key, index, value)}
      status={status}
    />);
  }
  handleChange(key, index, value) {
    this.state.selectedCluster.acls[index][key] = value;
    this.setState(this.state);
    //this.props.updateAcl();
  }
  create(index) {
    var self = this;
    var acl = lodash.merge({}, this.state.selectedCluster.acls[index], this.state.selectedCluster.cluster_id);
    this.props.createAcl(acl).then(() => {
      message.success('Create Acl success.');
      self.state.selectedCluster.acls[index].id = self.state.selectedCluster.acls.length;
      self.setState(self.state);
      //self.props.getUserAclList();
    }).catch(() => {
      message.error('Create Acl fail.');
    });
  }
  delete(index) {
    this.state.selectedCluster.acls.splice(index, 1);
    this.setState(this.state);
  }
  update(index) {
    var self = this;
    this.props.updateAcl({
      acl: this.state.selectedCluster.acls[index],
      clusterCode: this.state.selectedCluster.cluster_code
    }, {
      id: this.state.selectedCluster.acls[index].id
    }).then(() => {
      message.success('Update success.');
      self.props.getUserAclList();
    }).catch(() => {
      message.error('Update fail.');
    });
  }
  serverDelete(index) {
    var self = this;
    this.props.deleteAcl({
        acl: this.state.selectedCluster.acls[index],
        clusterCode: this.state.selectedCluster.cluster_code
      }, {
        id: this.state.selectedCluster.acls[index].id
      }
    ).then(() => {
      message.success('Delete success.');
      self.delete(index)
      //self.props.getUserAclList();
    }).catch((err) => {
      console.error(err);
      message.error('Delete fail.');
    });
  }
  changeCluster(cluster_code) {
    var self = this;
    var selectedCluster = self.state.selectedCluster;
    this.state.aclMeta.forEach(function(clusterAcl) {
      if (clusterAcl.cluster_code === cluster_code) {
        //self.state.selectedCluster = clusterAcl;
        selectedCluster = clusterAcl;
      }
    });
    this.setState({
      appList: null,
      loading: true
    });
    this.props.getAppList({
      clusterCode: cluster_code
    }).then((result) => {
      let appList = result.success.map(app => {
        return app.name;
      });
      appList.unshift('*');
      this.setState({
        selectedCluster: selectedCluster,
        appList: appList,
        loading: false
      });
    });
  }
  addAcl() {
    this.state.selectedCluster.acls.push({
      id: -1,
      name: '',
      cluster_admin: 0,
      apps: '',
      cluster_code: this.state.selectedCluster.cluster_code,
      cluster_id: this.state.selectedCluster.cluster_id,
      cluster_name: this.state.selectedCluster.cluster_name
    });
    this.setState(this.state);
  }
  render() {
    var selectedCluster = this.state.selectedCluster;
    var appList = this.state.appList;
    var aclMeta = this.state.aclMeta;
    if (aclMeta && selectedCluster) {
      return (
            <div className='acl-wrap'>
            {this.state.loading ? <Spin /> : null}
            <ClusterSelector clusters={aclMeta} changeCluster={this.changeCluster}/>
            <div className='aclTable-Wrap'>
                { appList ? (<div>
                                    <Table
                                    pagination = {false}
                                    dataSource={selectedCluster.acls}
                                    columns={this.columns}
                                    rowKey= { function (record, index) {
                                      return index;
                                    }}
                                  />
                                  <br/>
                                  <Button className="editable-add-btn" onClick={this.addAcl}>Add</Button>
                </div>) : null}
            </div>
            </div>
      );
    } else {
      return (
          <div className="acl-wrap">
            <div className="error-font"><span>您没有任何集群的管理权限</span></div>
          </div>
      );
    }
  }
}

let mapStateToProps = (store) => {
  let acl = store.acl;
  let app = store.app;
  return {
    acl,
    app
  }
}
let actions = require("../../actions");

module.exports = connect(mapStateToProps, {
  getUserAclList: actions.acl.getAcl,
  updateAcl: actions.acl.updateAcl,
  createAcl: actions.acl.createAcl,
  deleteAcl: actions.acl.deleteAcl,
  getAppList: actions.app.getAppList
})(Acl);