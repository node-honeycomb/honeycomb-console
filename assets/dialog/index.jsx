'use strict';

const React = require('react');
const ReactDOM = require('react-dom');
const store = require('../store');

const dialogs = [];

// dynamic create dialog.
// @param name,  required, dialog name, declared in ./${dialog name}/index.jsx
// @param value, optional
exports.createDialog = function (name, value) {
  const element = document.createElement('div');
  const component = require('./' + name + '/index.jsx');

  let resolvePromise, rejectPromise;
  const promise = new Promise((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });

  const dialog = {
    element,
    promise,
    component,
    resolvePromise,
    rejectPromise
  };
  dialogs.push(dialog);

  const comInstance = React.createElement(component, Object.assign({
    key: 'dialog-' + name + '-' + new Date().getTime(),
    visible: true,
    value: value || {},
    closeDialog: function (data) {
      dialog.resolvePromise(data);
      exports.destoryDialog(dialog);
    },
    cancelDialog: function (data) {
      dialog.rejectPromise(data);
      exports.destoryDialog(dialog);
    },
    resolveDialog: function (data) {
      dialog.resolvePromise(data);
      exports.destoryDialog(dialog);
    },
    store                                       // 注入 redux
  }));

  ReactDOM.render(comInstance, element);
  document.getElementsByTagName('body')[0].appendChild(element);

  return promise;
};

// destory react component and DOM element.
exports.destoryDialog = function (dialog) {
  ReactDOM.unmountComponentAtNode(dialog.element);
  document.getElementsByTagName('body')[0].removeChild(dialog.element);
}

