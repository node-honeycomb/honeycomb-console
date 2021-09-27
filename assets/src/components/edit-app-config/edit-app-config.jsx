import React, {useState, useRef} from 'react';
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

import './index.less';

const EditAppConfig = (props) => {
  const {appName, currentClusterCode, appType} = props;
  const [isEdit, setIsEdit] = useState(false);
  const [editorCode, setEditorCode] = useState('');
  const [applying, setApplying] = useState(false);

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

  const {result, loading} = useRequest({
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


  const onToggleEdit = () => {
    setIsEdit(!isEdit);
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

    const doApply = async (fixReload) => {
      try {
        setApplying(true);
        await api.configApi.updateAppConfig(appName, editorCode, currentClusterCode, appType);
        const key = appName;

        message.success({content: '配置修改成功！', key});

        if (fixReload) {
          message.loading({content: '重启应用中...', key, duration: 0});

          const appId = await api.appApi.getWorkingAppId(currentClusterCode, appName);

          if (!appId) {
            message.destroy();

            return message.warn({content: '当前应用没有正在运行的版本', key});
          }

          await api.appApi.reload(currentClusterCode, appId);
          message.destroy();
          message.success({content: '应用重启成功！', key});
        }

        await getAppConfig();
        setIsEdit(false);
      } catch (e) {
        notification.error({
          message: '修改配置失败',
          description: e.message
        });
      } finally {
        setApplying(false);
      }
    };

    callCodeDiff({
      newCode: editorCode,
      oldCode: result,
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
  const hasCodeChange = result.trim() !== editorCode.trim();

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
                    readOnly: !isEdit
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
                        loading={applying}
                      >
                        应用
                      </Button>
                      <Button
                        onClick={onToggleEdit}
                        disabled={applying}
                      >
                        取消
                      </Button>
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
                      <Button>配置对比</Button>
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
