import React, {useState, useEffect} from 'react';
import moment from 'moment';
import {diff} from 'just-diff';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import parser from 'editor-json-parser';
import {removeModalDOM} from '@lib/util';
import {UserOutlined} from '@ant-design/icons';
import {MonacoDiffEditor} from 'react-monaco-editor';
import {Modal, Button, List, notification} from 'antd';

import api from '@api';

const isJSONEql = (a, b) => {
  if (typeof a === 'string') {
    try {
      a = parser.parse(a);
    } catch (e) {
      a = undefined;
    }
  }
  if (typeof b === 'string') {
    try {
      b = parser.parse(b);
    } catch (e) {
      b = undefined;
    }
  }
  if (a === undefined || b === undefined) {
    return false;
  } else {
    return diff(a, b).length === 0;
  }
};

const CodeHistory = (props) => {
  const {onOk, close, appName, clusterCode, newCode} = props;
  const [visible, setVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [oldCode, setOldCode] = useState('{}');
  const [selectedItem, setSelectedItem] = useState(null);
  const [configList, setConfigList] = useState([]);

  useEffect(() => {
    let newCodeObject;

    try {
      newCodeObject = parser.parse(newCode);
    } catch (e) {
      newCodeObject = undefined;
    }
    api.configApi.getAppConfigHistory(appName, clusterCode)
      .then(r => {
        setConfigList(r);
        selectConfig(r.find((item => isJSONEql(item.config, newCodeObject))) || r[0]);
      });
  }, []);

  const selectConfig = item => {
    if (!item) return;
    setSelectedItem(item);
    setOldCode(JSON.stringify(item.config, null, '  '));
  };

  const onApply = async (reload = false) => {
    try {
      if (!selectedItem || !configList[0]) {
        notification.error({
          message: '错误',
          description: '未选择配置，无法应用。'
        });

        return;
      }

      if (isJSONEql(selectedItem.config, newCode)) {
        notification.info({
          message: '提示',
          description: '已是当前配置，无需更改。'
        });

        return;
      }
      setLoading(true);
      await onOk(selectedItem.config, reload);
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
          还原
        </Button>
        <Button
          loading={loading}
          type="primary"
          onClick={() => onApply(true)}
        >
          还原并重启
        </Button>
      </div>
    );
  };

  return (
    <Modal
      title="历史配置"
      footer={footer()}
      visible={visible}
      onCancel={onCancel}
      width={1000}
      className="code-history-modal"
    >
      <div style={{height: '100%'}}>
        <div style={{
          margin: '0 auto',
          width: '20%',
          height: '100%',
          display: 'inline-block',
          verticalAlign: 'top',
          overflowY: 'auto',
        }}>
          <List
            itemLayout="horizontal"
            dataSource={configList}
            renderItem={item => (
              <List.Item className="code-history-list-item" style={{
                backgroundColor: selectedItem === item ? '#f3f3f3' : null,
                cursor: 'pointer',
                paddingLeft: '20px',
                paddingRight: '10px',
                paddingTop: 5,
                paddingBottom: 5
              }}
              onClick={() => {
                selectConfig(item);
              }}
              >
                <List.Item.Meta
                  title={moment(item.gmt_create).format('YYYY-MM-DD HH:mm')}
                  description={(<span><UserOutlined /> {item.user}</span>)}
                />
              </List.Item>
            )}
          /></div>
        <div style={{
          margin: '0 auto',
          width: '70%',
          height: '100%',
          display: 'inline-block'
        }}>
          <MonacoDiffEditor
            width="100%"
            height="100%"
            language="json"
            original={oldCode}
            value={newCode}
            readOnly={true}
          />
        </div>
      </div>
    </Modal>
  );
};

CodeHistory.propTypes = {
  newCode: PropTypes.string,
  appName: PropTypes.string,
  clusterCode: PropTypes.string,
  onOk: PropTypes.func,
  close: PropTypes.func,
};

export default (props) => {
  const div = document.createElement('div');

  document.body.appendChild(div);
  const close = () => removeModalDOM(div);

  ReactDOM.render(
    <CodeHistory {...props} close={close} />,
    div
  );
};
