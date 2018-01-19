'use strict';

let React = require('react');
let connect = require('react-redux').connect;
let consts = require('../services/consts');
let DemoTable = require('./coms/demo_table/index.jsx');
let DemoCom = require('./coms/demo/index.jsx');
let _ = require('lodash');

require("./demo_ajax.less");
var DemoApp = React.createClass({
  componentDidMount: function () {
    console.log('component did mount.');
  },
  getInitialState: function() {
    return {};
  },
  render: function() {
    return (
      <div className="demo-app">
        <p>
          调用api出错: {this.props.models.user.fetchFailed ? 'true' : 'false'}
        </p>
        <DemoCom
          testApi={this.props.getUserList}
          testErrorApi={this.props.getUserListError}
          content="visistor"
        />
        <DemoTable
          sortUsers={this.props.sortUsers}
          models={this.props.models}
        />
      </div>
    );
  }
});

function mapStateToProps(state) {
  let models = state.models;

  return {
    models
  };
}

let actions = require('../actions');

module.exports = connect(
  mapStateToProps, {
    // ajax
    getUserList: actions.models.getList,
    getUserListError: actions.models.getListError,
    // sync actions
    sortUsers: actions.models.sortUsers
  }
)(DemoApp);

