import React, {useState} from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import {Modal, Button} from 'antd';
import {MonacoDiffEditor} from 'react-monaco-editor';

const CodeDiff = (props) => {
  const {newCode, oldCode, onOk} = props;
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
  };

  const footer = () => {
    return (
      <div>
        <Button onClick={onCancel}>取消</Button>
        <Button loading={loading} onClick={onApply}>应用</Button>
        <Button loading={loading} type="primary" onClick={() => onApply(true)}>应用并重启</Button>
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
        <MonacoDiffEditor
          width="900"
          height="600"
          language="json"
          original={oldCode}
          value={newCode}
          readOnly={true}
        />
      </div>
    </Modal>
  );
};

CodeDiff.propTypes = {
  newCode: PropTypes.string,
  oldCode: PropTypes.string,
  onOk: PropTypes.func
};

export default (props) => {
  const div = document.createElement('div');

  document.body.appendChild(div);

  ReactDOM.render(
    <CodeDiff {...props} />,
    div
  );
};
