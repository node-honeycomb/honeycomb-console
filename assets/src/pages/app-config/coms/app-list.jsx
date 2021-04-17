import React from 'react';
import PropTypes from 'prop-types';
import {useRequest} from '@lib/hooks';
import notification from '@coms/notification';
import Tree from '@coms/tree';
import api from '@api/index';
import {ADMIN_APP_CODE} from '@lib/consts';

import {connect} from 'dva';

const USER_APP = '用户应用';
const SYSTEM_APP = '系统应用';

/**
 * 获取符合Tree组件要求的结构
 * @param {String[]} appNames 应用名
 */
const getAppTree = (appNames = []) => {
  const tree = [];

  tree.push({
    title: USER_APP,
    key: USER_APP,
    level: 0,
    parent: null
  });

  appNames.forEach(appName => {
    if (appName === ADMIN_APP_CODE) {
      return;
    }

    tree.push({
      title: appName,
      key: appName,
      level: 1,
      parent: USER_APP
    });
  });

  tree.push({
    title: SYSTEM_APP,
    key: SYSTEM_APP,
    level: 0,
    parent: null
  });

  // 公共配置
  tree.push({
    key: 'common*system',
    title: '公共配置',
    level: 1,
    parent: SYSTEM_APP
  });

  // 公共配置
  tree.push({
    key: 'server*system',
    title: '系统配置',
    level: 1,
    parent: SYSTEM_APP
  });

  return tree;
};

const AppList = (props) => {
  const {currentClusterCode, onSelect, activeAppName} = props;

  const {result: appList, loading} = useRequest({
    request: async () => {
      if (!currentClusterCode) {
        return [];
      }

      const result = await api.appApi.appList(currentClusterCode);

      return result.success;
    },
    onError: (err) => {
      notification.error({
        message: '获取应用列表失败',
        description: err.message
      });
    },
    defaultValue: []
  }, [currentClusterCode]);

  return (
    <Tree
      loading={loading}
      onSelect={onSelect}
      tree={getAppTree(appList.map(app => app.name))}
      activeKey={activeAppName}
      defaultActiveKey={USER_APP}
    />
  );
};

AppList.propTypes = {
  onSelect: PropTypes.func,
  currentClusterCode: PropTypes.string,
  activeAppName: PropTypes.string,        // 当前选中的 app name
  defaultAppName: PropTypes.string
};

const mapState2Props = (state) => {
  return {
    currentClusterCode: state.global.currentClusterCode
  };
};

export default connect(mapState2Props)(AppList);
