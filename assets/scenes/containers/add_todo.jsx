'use strict';

const React = require('react');
const connect = require('react-redux').connect;

const AddTodo = React.createClass({
  getInitialState: function () {
    return {
      value: ''
    };
  },
  render: function () {
    return (
      <div>
        <input type="text" value={this.state.value} onChange={this.inputChange}/>
        <button onClick={this.onClick}>Add Todo</button>
      </div>
    );
  },
  inputChange: function (evt) {
    this.setState({
      value: evt.target.value
    });
  },
  onClick: function () {
    this.props.addTodo(this.state.value);
    this.setState({
      value: ''
    });
  }
});

let actions = require('../../actions');

const noop = () => ({});
module.exports = connect(
  noop,
  {
    addTodo: actions.todo.add
  }
)(AddTodo);
