'use strict';

const React = require('react');
const lodash = require('lodash');
const connect = require('react-redux').connect;
const AddUserModal = require('./add-user-modal.jsx');
import { Modal, Button, Table, Icon, Tag, Select, Input, Popconfirm, message, Spin } from 'antd';


require('./user.less');


class User extends React.Component {
  state = {
    showCreateUserModal: false,
    users: [],
    editUser: null
  }
  constructor(props, context) {
    super(props, context);
    this.columns = [
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name'
      },
      {
        title: 'Role',
        dataIndex: 'role',
        key: 'role'
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status'
      },
      {
        title: '操作',
        dataIndex: 'operation',
        width: '20%',
        render: (text, record, index) => {
          return (
            <div className="editable-row-operations">
                <span style={{marginRight: 20 + 'px'}}>
                  <a onClick={() => this.showEditUserModal(record)}>编辑</a>
                </span>
                { record.role !== 1 ?
                  <span>
                    <Popconfirm title="确认删除?" onConfirm={() => this.deleteUser(record.name)}>
                      <a>删除</a>
                    </Popconfirm>
                  </span> : ''
                }
            </div>
          );
        },
      }
    ];
    this.props.listUser();
  }
  componentWillReceiveProps(nextProps) {
    this.setState({
      users: nextProps.user.users
    });
  }
  deleteUser(name) {
    this.props.deleteUser({}, {name: name})
      .then(() => {
        this.props.listUser();
      });
  }
  showCreateUserModal() {
    this.setState({
      showCreateUserModal: true,
      editUser: null
    });
  }
  showEditUserModal(data) {
    this.setState({
      showCreateUserModal: true,
      editUser: data
    });
  }
  hideCreateUserModal() {
    this.setState({
      showCreateUserModal: false
    });
    this.props.listUser();
  }
  render() {
    var users = this.props.user.users;
    return (
      <div className='user-wrap'>
        <div className='aclTable-Wrap'>
          <div>
            <Table
                pagination = {false}
                dataSource={users}
                columns={this.columns}
                rowKey= {function (record, index) {
                  return index;
                }}
            />
            <br/>
            <Button className="editable-add-btn" onClick={this.showCreateUserModal.bind(this)}>Add</Button>
          </div>
        </div>
        <AddUserModal
          createUser={this.props.createUser}
          visible={this.state.showCreateUserModal}
          edit={this.state.editUser}
          onHide={this.hideCreateUserModal.bind(this)}
        />
      </div>
    );
  }
}

let mapStateToProps = (store) => {
  let user = store.user;
  let app = store.app;
  return {
    user,
    app
  };
};

let actions = require('../../actions');

module.exports = connect(mapStateToProps, {
  listUser: actions.user.listUser,
  createUser: actions.user.createUser,
  deleteUser: actions.user.deleteUser
})(User);
