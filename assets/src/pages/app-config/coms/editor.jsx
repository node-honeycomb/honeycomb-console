import React, {useState, useEffect} from 'react';
import MonacoEditor from 'react-monaco-editor';
import {Button} from 'antd';

const Editor = ({appId}) => {
  const [editStatus, setEditStatus] = useState(false);
  const [diffStatus, setDiffStatus] = useState(false);

  useEffect(() => {
    // TODO 获取当前APP配置
    return () => {};
  });

  return (
    <div className="editor-wrap">
      <MonacoEditor />
      {diffStatus ? (
        <MonacoEditor />
      ) : null}
      <div>
        {editStatus ? (
          <Button onClick={() => setEditStatus(true)}>
          保存并发布
          </Button>
        ) : null}
        <Button onClick={() => setEditStatus(true)}>
          {editStatus ? '保存配置' : '编辑配置'}
        </Button>
        <Button onClick={() => setDiffStatus(true)}>配置对比</Button>
      </div>
    </div>
  );
};

export default Editor;
