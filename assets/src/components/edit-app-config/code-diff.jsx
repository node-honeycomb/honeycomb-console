import React, {useState} from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import {Modal, Button} from 'antd';
import {DiffEditor} from '@monaco-editor/react';
import {removeModalDOM} from '@lib/util';

const CodeDiff = (props) => {
  const {newCode, oldCode, onOk, close} = props;
  const [visible, setVisible] = useState(true);
  const [loading, setLoading] = useState(false);

  const onApply = async (reload = false) => {
    try {
      setLoading(true);
      await onOk(reload);
      onCancel();
    } catch (err) {
      err;
    } finally {
      setLoading(false);
    }
  };

  const onCancel = () => {
    setVisible(false);
    close();
  };

  const footer = () => {
    return (
      <div>
        <Button
          onClick={onCancel}
        >
          取消
        </Button>
        <Button
          loading={loading}
          onClick={() => onApply()}
        >
          应用
        </Button>
        <Button
          loading={loading}
          type="primary"
          onClick={() => onApply(true)}
        >
          应用并重启
        </Button>
      </div>
    );
  };

  return (
    <Modal
      title="配置修改确认"
      footer={footer()}
      visible={visible}
      onCancel={onCancel}
      width={1000}
      className="code-diff-modal"
    >
      <div style={{margin: '0 auto'}}>
        <DiffEditor
          width="900"
          height="600"
          defaultLanguage="json"
          original={oldCode}
          modified={newCode}
          readOnly={true}
        />
      </div>
    </Modal>
  );
};

CodeDiff.propTypes = {
  newCode: PropTypes.string,
  oldCode: PropTypes.string,
  onOk: PropTypes.func,
  close: PropTypes.func,
};

export default (props) => {
  const div = document.createElement('div');

  document.body.appendChild(div);
  const close = () => removeModalDOM(div);

  ReactDOM.render(
    <CodeDiff {...props} close={close} />,
    div
  );
};
