'use strict';

const React = require('react');
const connect = require('react-redux').connect;
const TodoItem = require('../coms/todo_item.jsx');

const TodoList = React.createClass({
  render: function () {
    let filterType = this.props.filterType;
    let todoList = this.props.todoList.filter(item => {
      if (filterType === 'ALL') {
        return true;
      } else if (filterType === 'ACTIVE') {
        return !item.completed;
      } else if (filterType === 'COMPLETED') {
        return !!item.completed;
      }
    });

    return (
      <ul className="todo-list">
        {
          todoList.map(todo => {
            return (
              <TodoItem
                key={todo.key}
                text={todo.value}
                completed={todo.completed ? true : false}
                onClick={this.onClick.bind(this, todo)}
              />
            );
          })
        }
      </ul>
    )
  },
  onClick: function (todoItem) {
    todoItem.completed ?
      this.props.updateItem({
        key: todoItem.key,
        completed: false
      }) :
      this.props.updateItem({
        key: todoItem.key,
        completed: true
      });
  }
});

let actions = require('../../actions');

module.exports = connect(
  function (store) {
    return {
      todoList: store.todo.result.map(key => store.todo.todos[key]),
      filterType: store.todo.filter
    };
  }, {
    updateItem: actions.todo.update
  }
)(TodoList);