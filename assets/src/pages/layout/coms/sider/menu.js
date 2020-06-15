import React from 'react';
import {
  FileSearchOutlined, TeamOutlined, AppstoreOutlined,
  CloudUploadOutlined, ControlOutlined, ClusterOutlined,
  DeploymentUnitOutlined, SettingOutlined
} from '@ant-design/icons';

import PAGES from '../../../../lib/pages';

const menu = [
  {
    title: '运维',
    first: true,
  },
  {
    title: '应用运维',
    link: PAGES.APP_DEV,
    icon: <AppstoreOutlined />
  },
  {
    title: '应用发布',
    link: PAGES.APP_CI,
    icon: <CloudUploadOutlined />
  },
  {
    title: '应用配置',
    link: PAGES.APP_CONFIG,
    icon: <SettingOutlined />
  },
  {
    title: '监控',
    first: true,
  },
  {
    title: '日志查询',
    icon: <FileSearchOutlined />,
    link: PAGES.LOG
  },
  {
    title: '系统监控',
    link: PAGES.SYS_MONITOR,
    icon: <ControlOutlined />
  },
  {
    title: '管理',
    first: true,
  },
  {
    title: '集群管理',
    link: PAGES.CLUSTER_MANAGER,
    icon: <ClusterOutlined />
  },
  {
    title: '集群授权',
    link: PAGES.CLUSTER_AUTH,
    icon: <DeploymentUnitOutlined />
  },
  {
    title: '用户管理',
    icon: <TeamOutlined />,
    link: PAGES.USER_MANAGER
  }
];

export default menu;

