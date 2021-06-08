import React, {useState} from 'react';
import PropTypes from 'prop-types';
import {useRequest} from '@lib/hooks';
import notification from '@coms/notification';
import Tree from '@coms/tree';
import api from '@api/index';
import {ADMIN_APP_CODE} from '@lib/consts';
import {connect} from 'dva';
import SearchTree from './search-tree';


import './search-module.less';

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
  /**
   * 搜索框的各个状态，分别是列表树的元素、上一次搜索的字符串、
   * 用户输入的字符串和选中次数（用来通知外层的树改变形态）
   */
  const [fileSearchItem, setFileSearchItem] = useState([]);
  const [lastSearchString, setLastSearchString] = useState('');
  const [searchInputString, setSearchInputString] = useState('');
  const [searchTimes, setSearchTimes] = useState(0);

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

  const onSelectSearchTreeItem = (filepath) => {
    onSelect(filepath);
    setSearchTimes(searchTimes + 1);
    setFileSearchResultList('');
  };

  // 文件搜索框的下拉列表
  const FileSearchResultList = () => {
    return (
      <div className="file-search-result-list">
        {
          fileSearchItem.length !== 0 ?
            <SearchTree
              tree={fileSearchItem}
              loading={loading}
              onSelect={onSelectSearchTreeItem}
              keywords={lastSearchString}
            /> :
            lastSearchString === '' ?
              null : <div className="file-search-result-item">没有数据</div>
        }
      </div>
    );
  };

  // 用户输入改变时，改变搜索到的数据
  const setFileSearchResultList = (v) => {
    if (v === '') {
      setFileSearchItem([]);
      setLastSearchString('');
      setSearchInputString('');

      return null;
    }
    if (v.target.value === '') {
      setFileSearchItem([]);
      setLastSearchString(v.target.value);
      setSearchInputString('');

      return null;
    }
    setSearchInputString(v.target.value);
    // 搜寻到的item列表原型
    let tmpSearchItemList = [];

    if (v.target.value.includes(lastSearchString) && lastSearchString !== '') {
      tmpSearchItemList = fileSearchItem.filter((item) => {
        return item.title.includes(v.target.value);
      });
    } else {
      tmpSearchItemList = getAppTree(appList.map(app => app.name)).filter((item) => {
        return item.title.includes(v.target.value);
      });
    }

    // 用来去重的set
    const tmpSet = new Set();
    // 最终将要setstate的列表
    const finalSearchItemList = [];

    // 先将每一个元素全部都正确地插进数组中，最后再进行排序处理
    for (let cc = 0; cc < tmpSearchItemList.length; cc++) {
      let nowNode = tmpSearchItemList[cc];

      while (nowNode) {
        if (tmpSet.has(nowNode.key)) {
          break;
        }
        nowNode.filepath = (nowNode.parent ? nowNode.parent : '') + '/' + nowNode.key;
        finalSearchItemList.push(nowNode);
        tmpSet.add(nowNode.key);
        nowNode = getAppTree(appList.map(app => app.name)).find((item) => {
          return item.key === nowNode.parent;
        });
      }
    }
    setFileSearchItem(finalSearchItemList.sort((a, b) => {
      return a.filepath > b.filepath;
    }));
    setLastSearchString(v.target.value);
  };

  return (
    <div>
      <input
        value={searchInputString}
        className="file-search-bar"
        placeholder="文件搜索"
        onChange={(e) => setFileSearchResultList(e)}
      />
      <FileSearchResultList></FileSearchResultList>
      <Tree
        loading={loading}
        onSelect={onSelect}
        tree={getAppTree(appList.map(app => app.name))}
        activeKey={activeAppName}
        defaultActiveKey={USER_APP}
        treeStatusChange={searchTimes}
      />
    </div>
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