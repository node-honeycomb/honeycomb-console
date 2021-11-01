import React, {useState, useRef, useCallback} from 'react';
import _ from 'lodash';
import {connect} from 'dva';
import PropTypes from 'prop-types';
import {withRouter} from 'dva/router';
import MonacoEditor from 'react-monaco-editor';
import {Button, Spin, Modal, Empty, message} from 'antd';

import api from '@api';
import {useRequest} from '@lib/hooks';
import parser from 'editor-json-parser';
import notification from '@coms/notification';

import callCodeDiff from './code-diff';
import callCodeHistory from './code-history';

import './index.less';

const EditAppConfig = (props) => {
  const {appName, currentClusterCode, appType} = props;
  const [isEdit, setIsEdit] = useState(false);
  const [oldCode, setOldCode] = useState('');
  const [editorCode, setEditorCode] = useState('');

  const editorRef = useRef();

  const getAppConfig = async () => {
    if (!currentClusterCode || !appName) {
      return null;
    }

    const result = await api.configApi.getAppConfig(
      appName, currentClusterCode, appType
    );

    if (Array.isArray(result.error) && result.error.length) {
      throw Error(result.error[0]);
    }

    const code = JSON.stringify(_.get(result, 'success[0].data'), null, 2);

    setEditorCode(code);
    setOldCode(code);

    if (editorRef.current) {
      editorRef.current.setSelection({
        endColumn: 0,
        endLineNumber: 0,
        startColumn: 0,
        startLineNumber: 0
      });
    }

    return code;
  };

  const {loading} = useRequest({
    request: async () => {
      return getAppConfig();
    },
    onError: (err) => {
      notification.error({
        message: `获取应用${appName}的配置失败，请刷新重试`,
        description: err.message
      });
    },
    defaultValue: ''
  }, [appName, currentClusterCode, appType]);


  const showCodeHistory = useCallback(() => callCodeHistory({
    appName,
    clusterCode: currentClusterCode,
    newCode: oldCode,
    onOk: (config, reload) => {
      config = JSON.stringify(config, null, '  ');
      setEditorCode(config);
      doApply(reload, config, 'false');
    }
  }), [appName, currentClusterCode, editorCode, oldCode]);

  const onToggleEdit = () => {
    setIsEdit(!isEdit);
  };

  const doApply = async (fixReload, config = editorCode, saveConfig = 'true') => {
    try {
      await api.configApi.updateAppConfig(appName, config, currentClusterCode, appType, saveConfig);
      message.success('配置修改成功！');

      if (fixReload) {
        message.loading('重启应用中...');

        const appId = await api.appApi.getWorkingAppId(currentClusterCode, appName);

        if (!appId) {
          message.destroy();

          return message.warn('当前应用没有正在运行的版本');
        }

        await api.appApi.reload(currentClusterCode, appId);
        message.destroy();
        message.success('应用重启成功！');
      }

      await getAppConfig();
      setIsEdit(false);
    } catch (e) {
      notification.error({
        message: '修改配置失败',
        description: e.message
      });
    }
  };

  // 应用配置
  const onApply = async () => {
    try {
      parser.parse(editorCode);
    } catch (e) {
      Modal.error({
        title: '配置解析失败',
        content: <div style={{whiteSpace: 'pre-line'}}>{e.message}</div>,
        okText: '好的'
      });

      return;
    }

    callCodeDiff({
      newCode: editorCode,
      oldCode: oldCode,
      onOk: (reload) => {
        let fixReload = reload;

        if (appName === 'common' || appName === 'server') {
          fixReload = false;
          Modal.confirm({
            content: appName === 'common' ? '请注意，公共配置生效，需重启对应应用即可！' : '请注意，系统配置生效，需重启任意应用即可！',
            onOk: () => {
              doApply(fixReload);
            },
            onCancel: () => {
              return;
            }
          });
        } else {
          doApply(fixReload);
        }
      }
    });
  };

  // 代码是否编辑过
  const hasCodeChange = oldCode.trim() !== editorCode.trim();

  return (
    <React.Fragment>
      <div className="list-title">
        应用配置 | {appName}
        {
          isEdit && (
            <span style={{color: 'red'}}>
            （编辑中）
            </span>
          )
        }
      </div>
      {
        !appName && (
          <Empty className="config-empty" description="请在左侧选择一个应用进行配置编辑" />
        )
      }
      {
        appName && (
          <div
            className="edit-app-config"
          >
            <Spin spinning={loading}>
              <div className="editor">
                <MonacoEditor
                  width="100%"
                  height="100%"
                  language="json"
                  theme="vs"
                  value={editorCode}
                  options={{
                    theme: 'vs',
                    readOnly: !isEdit,
                    automaticLayout: true
                  }}
                  onChange={setEditorCode}
                  editorDidMount={(editor) => editorRef.current = editor}
                />
              </div>
              <div className="footer">
                {
                  isEdit && (
                    <React.Fragment>
                      <Button
                        type="primary"
                        disabled={!hasCodeChange}
                        onClick={onApply}
                      >
                        应用
                      </Button>
                      <Button onClick={onToggleEdit}>取消</Button>
                    </React.Fragment>
                  )
                }
                {
                  !isEdit && (
                    <React.Fragment>
                      <Button
                        type="primary"
                        onClick={onToggleEdit}
                      >
                      编辑
                      </Button>
                      <Button onClick={showCodeHistory}>
                        历史配置
                      </Button>
                    </React.Fragment>
                  )
                }
              </div>
            </Spin>
          </div>


        )
      }
    </React.Fragment>
  );
};

EditAppConfig.propTypes = {
  appName: PropTypes.string,
  currentClusterCode: PropTypes.string,
  appType: PropTypes.string
};

EditAppConfig.defaultProps = {
  appType: 'app'
};

const mapState2Props = (state) => {
  return {
    currentClusterCode: state.global.currentClusterCode
  };
};

export default withRouter(connect(mapState2Props)(EditAppConfig));
