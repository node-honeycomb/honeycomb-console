'use strict';

var React = require('react');
var connect = require('react-redux').connect;
import { Form, Icon, Input, Button, Checkbox, message} from 'antd';
const FormItem = Form.Item
import { RouteContext } from 'react-router';
class NormalLoginForm extends React.Component {
  constructor(props, context) {
    super(props, context);
  }
  handleSubmit = (e) => {
    let that = this;
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        this.props.loginAuth(values).then((data)=>{
          message.success('登录成功');
          that.context.router.push({
            pathname: '/pages/list',
            // query: message,
          })
        });
      }
    });
  }
  render() {
    const { getFieldDecorator } = this.props.form;
    return (
        <Form onSubmit={this.handleSubmit} className="login-form">
        <FormItem>
          {getFieldDecorator('username', {
            rules: [{ required: true, message: 'Please input your username!' }],
          })(
            <Input prefix={<Icon type="user" style={{ fontSize: 13 }} />} placeholder="Username" />
          )}
        </FormItem>
        <FormItem>
          {getFieldDecorator('password', {
            rules: [{ required: true, message: 'Please input your Password!' }],
          })(
            <Input prefix={<Icon type="lock" style={{ fontSize: 13 }} />} type="password" placeholder="Password" />
          )}
        </FormItem>
        <FormItem>
          <Button type="primary" htmlType="submit" className="login-form-button">
            Log in
          </Button>
        </FormItem>
      </Form>
    );
  }
}

const LoginForm = Form.create()(NormalLoginForm);
let actions = require("../../actions");
NormalLoginForm.contextTypes = {
  router: React.PropTypes.object
}
module.exports = LoginForm;
