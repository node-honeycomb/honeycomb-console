'use strict';

const React = require('react');
const connect = require('react-redux').connect;

const ShowController = React.createClass({
  render: function () {
    let that = this;
    return (
      <div>
        {
          this.props.filterType === 'ALL' ?
            'All' :
            <a onClick={that.props.changeFilter.bind(this, 'ALL')}>All</a>
        } ,
        {
          this.props.filterType === 'ACTIVE' ?
            'Active' :
            <a onClick={that.props.changeFilter.bind(this, 'ACTIVE')}>Active</a>
        } ,
        {
          this.props.filterType === 'COMPLETED' ?
            'Completed' :
            <a onClick={that.props.changeFilter.bind(this, 'COMPLETED')}>Completed</a>
        }
      </div>
    );
  }
});

let actions = require('../../actions');

module.exports = connect(
  function (store) {
    return {
      filterType: store.todo.filter
    }
  },
  {
    changeFilter: actions.todo.changeFilter
  }
)(ShowController);
