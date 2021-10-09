import React, {useEffect, useState} from 'react';
import {connect} from 'dva';
import api from '@api/index';
import {notification} from 'antd';
import PropTypes from 'prop-types';
import {withRouter} from 'dva/router';

import setQuery from '@lib/set-query';
import s2q from '@lib/search-to-query';
import msgParser from '@lib/msg-parser';
import filepaths2tree from '@lib/filepath-to-tree';

import FileTree from './coms/file-tree';
import LogPanel from '../../components/log-panel';

import './index.less';

const DEFAULT_ACTIVE_LOG = 'server.{year}-{month}-{day}.log';

// 日志模块
const Log = (props) => {
  const {currentClusterCode, currentCluster} = props;
  const [filesLoading, setFileLoading] = useState(false);
  const [tree, setTree] = useState([]);
  const [activeLog, setActiveLog] = useState(DEFAULT_ACTIVE_LOG);
  const [initing, setIniting] = useState(true);
  /**
   * 搜索框的各个状态，分别是列表树的元素、上一次搜索的字符串、
   * 用户输入的字符串和选中次数（用来通知外层的树改变形态）
   */
  const [fileSearchItem, setFileSearchItem] = useState([]);
  const [lastSearchString, setLastSearchString] = useState('');
  const [searchInputString, setSearchInputString] = useState('');
  const [isSearching, setSearching] = useState(false);

  // 获取日志列表
  const getLogFiles = async (currentClusterCode) => {
    if (!currentClusterCode) {
      return;
    }

    setFileLoading(true);
    try {
      const files = await api.logApi.getLogFiles(currentClusterCode);
      const tree = filepaths2tree(files);

      setTree(tree);

      return tree;
    } catch (e) {
      notification.error({
        message: '获取日志列表失败',
        description: msgParser(e.message)
      });
    } finally {
      setFileLoading(false);
    }
  };

  const readHistoryLogFilepath = (tree) => {
    const query = s2q(props.location.search);
    let historyLogFp = query.logFilepath;
    const appName = query.appName;

    if (!Array.isArray(tree)) {
      return;
    }

    if (appName && !historyLogFp) {
      const firstLogfile = tree.find(item => {
        return item.filepath && item.filepath.startsWith(appName + '/');
      });

      historyLogFp = firstLogfile && firstLogfile.key;
    }

    if (!historyLogFp) {
      return;
    }


    if (!tree.some(item => item.key === historyLogFp)) {
      return;
    }

    onSelectFile(historyLogFp);
  };

  useEffect(() => {
    (async () => {
      setIniting(true);
      const tree = await getLogFiles(currentClusterCode);

      setFileSearchItem(tree);
      readHistoryLogFilepath(tree);
      setIniting(false);
    })();
  }, [currentClusterCode]);

  const onSelectFile = (filepath) => {
    setSearching(false);
    setQuery(props.location, props.dispatch, {logFilepath: filepath});
    setActiveLog(filepath);
  };

  // 用户输入改变时，改变搜索到的数据
  const setFileSearchResultList = (v) => {
    setSearching(true);
    if (v === '') {
      setFileSearchItem(tree);
      setLastSearchString('');
      setSearchInputString('');
      setSearching(false);

      return null;
    }
    if (v.target.value === '') {
      setFileSearchItem(tree);
      setLastSearchString(v.target.value);
      setSearchInputString('');
      setSearching(false);

      return null;
    }
    setSearchInputString(v.target.value);
    // 搜寻到的item列表原型
    let tmpSearchItemList = [];

    if (v.target.value.includes(lastSearchString) && lastSearchString !== '') {
      tmpSearchItemList = fileSearchItem.filter((item) => {
        return item.title.toLowerCase().includes(v.target.value.toLowerCase());
      });
    } else {
      tmpSearchItemList = tree.filter((item) => {
        return item.title.toLowerCase().includes(v.target.value.toLowerCase());
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
        finalSearchItemList.push(nowNode);
        tmpSet.add(nowNode.key);
        nowNode = tree.find((item) => {
          return item.key === nowNode.parent;
        });
      }
    }

    setFileSearchItem(finalSearchItemList.sort((a, b) => {
      // 由于根目录文件的特殊路径，这里需要特殊处理
      if (a.key === '系统日志') {
        return false;
      }
      if (b.key === '系统日志') {
        return true;
      }
      if (a.parent === '系统日志' && b.parent !== '系统日志') {
        return false;
      }
      if (b.parent === '系统日志' && a.parent !== '系统日志') {
        return true;
      }
      if (a.parent === '系统日志' && b.parent === '系统日志') {
        return a.key > b.key;
      }

      return a.key > b.key;
    }));
    setLastSearchString(v.target.value);
  };

  return (
    <div>
      <div className="page-left-side">
        <div className="list-title">日志列表</div>
        {
          !initing &&
            <div>
              <input
                value={searchInputString}
                className="file-search-bar"
                placeholder="请键入关键词以搜索"
                onChange={(e) => setFileSearchResultList(e)}
              />
            </div>
        }
        {
          !initing && (
            <FileTree
              tree={isSearching ? fileSearchItem : tree}
              loading={filesLoading}
              onSelect={onSelectFile}
              activeKey={activeLog}
              defaultActiveKey={activeLog}
              keywords={lastSearchString}
              searchStatus={isSearching}
            />
          )
        }
      </div>
      <div className="page-right-side">
        <LogPanel
          clusterCode={currentClusterCode}
          logFileName={activeLog}
          currentCluster={currentCluster}
        />
      </div>
    </div>
  );
};

const mapState2Props = (state) => {
  return {
    currentClusterCode: state.global.currentClusterCode,
    currentCluster: state.global.currentCluster
  };
};

Log.propTypes = {
  currentClusterCode: PropTypes.string,
  location: PropTypes.object,
  dispatch: PropTypes.func,
  currentCluster: PropTypes.object
};

export default withRouter(connect(mapState2Props)(Log));
