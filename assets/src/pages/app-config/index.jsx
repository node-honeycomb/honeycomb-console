import React, {useState, useCallback} from 'react';
import {Layout, Empty} from 'antd';
import Editor from './coms/editor';
import AppList from './coms/app-list';
import './app-config.less';

const {Content, Sider} = Layout;
const AppConfig = () => {
  const [appId, setAppId] = useState();
  const selectApp = value => setAppId(value);

  return (
    <div className="app-config">
      <h2>应用配置</h2>
      <Layout>
        <Sider width={180} className="site-layout-background">
          <AppList
            setAppId={selectApp}
          />
        </Sider>
        <Layout style={{padding: '0 24px 24px'}}>
          <Content className="app-config-content">
            {
              appId ? (
                <Editor appId={appId} />
              ) : (
                <div className="editor-wrap">
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请选择APP" />
                </div>
              )
            }
          </Content>
        </Layout>
      </Layout>
    </div>
  );
};

export default AppConfig;
