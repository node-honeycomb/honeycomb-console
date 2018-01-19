'use strict';

const React = require('react');
const Modal = require('antd/lib/modal');
const Dialog = require('../index.jsx');

let Modal1 = React.createClass({
  render: function () {
    return (
      <Modal {...this.props}
                    title="测试浮层"
                    className="test-modal1"
                    onOk={this.handleOk}
                    onCancel={this.handleCancel}
                    width={600}>
        <p>hello {this.props.value.content || 'modal1'}.</p>
        <input/>
      </Modal>
    );
  },
  handleOk: function () {
    Dialog.createDialog(
      'example_dialog',
      {content: 'modal2'}
    ).then(d => {
      console.log('resolveDialog');
    }).catch(e => {
      console.log('rejectDialog');
    });
  },
  handleCancel: function () {
    let rdm = Math.random();
    if (rdm > 0.7) {
      console.log('to resolve');
      this.props.resolveDialog();
    } else if (rdm > 0.3) {
      console.log('to close');
      this.props.closeDialog();
    } else {
      console.log('to cancel');
      this.props.cancelDialog();
    }
  }
});

module.exports = Modal1;

