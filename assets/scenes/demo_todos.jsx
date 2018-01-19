'use strict';

const React = require('react');
const AddTodo = require('./containers/add_todo.jsx');
const TodoList = require('./containers/todo_list.jsx');
const ShowController = require('./containers/show_controller.jsx');

require('./demo_todos.less');
const DemoTodos = React.createClass({
  render: function () {
    return (
      <div className="demo-todos">
        <AddTodo />
        <TodoList />
        <ShowController />
      </div>
    );
  }
});

module.exports = DemoTodos;
