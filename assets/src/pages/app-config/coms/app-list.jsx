import React, {useState, useEffect} from 'react';
import {Menu} from 'antd';
import _ from 'lodash';
import {CodeOutlined, PlayCircleOutlined} from '@ant-design/icons';
// import {appListApi} from '@api/index';
import {getData} from './data.js';

const {SubMenu} = Menu;
const AppList = ({setAppId}) => {
  const [loading, setLoading] = useState(false);
  const [appList, setAppList] = useState([]);

  useEffect(() => {
    // TODO 获取 APP 列表
    setLoading(true);
    getData.then(({list}) => {
      setAppId(_.get(list, '[0].id', '')); // 默认选择第一个APP
      setAppList(list);
      setLoading(false);
    }).catch((err) => {
      console.log('AppList -> err', err);
      setLoading(false);
    });
  }, []);

  return (
    <Menu
      mode="inline"
      defaultSelectedKeys={['vue']}
      defaultOpenKeys={['sub1']}
      onClick={({key}) => setAppId(key)}
      style={{height: '100%', borderRight: 0}}
    >
      <SubMenu key="sub1" icon={<PlayCircleOutlined />} title="应用列表">
        {
          appList.map(item => {
            return (
              <Menu.Item key={item.id}>{item.name}</Menu.Item>
            );
          })
        }
      </SubMenu>
      <SubMenu key="sub2" icon={<CodeOutlined />} title="系统应用">
        <Menu.Item key="3">common</Menu.Item>
        <Menu.Item key="4">server</Menu.Item>
      </SubMenu>
    </Menu>
  );
};

export default AppList;
