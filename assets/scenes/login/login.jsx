'use strict';

var React = require('react');
var connect = require('react-redux').connect;
import { Form, Icon, Input, Button, Checkbox } from 'antd';
const FormItem = Form.Item;
let LoginForm = require('./form.jsx');
require('./login.less');
import { RouteContext } from 'react-router';
class Login extends React.Component {
  constructor(props,context) {
    super(props,context);
  }
  render() {
    return (
      <div className="login-wrap">

        <div className="form-wrap">
          <h3>管理后台登录</h3>
          <LoginForm
            loginAuth={this.props.loginAuth}
          />
        </div>  
      </div>
    );
  }
}
let mapStateToProps = (store) => {
  return{}
}
let actions = require("../../actions");
Login.contextTypes = {
  router: React.PropTypes.object
}
module.exports = connect(mapStateToProps,{
  loginAuth : actions.login.loginAuth
})(Login);

