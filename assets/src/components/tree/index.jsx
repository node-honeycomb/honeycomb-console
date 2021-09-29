import React, {useState, useEffect} from 'react';
import {Spin} from 'antd';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import scrollIntoView from 'scroll-into-view';
import {FolderOpenOutlined, FolderOutlined} from '@ant-design/icons';

import './index.less';


const getMaster = (tree, nodeKey) => {
  if (!tree || !nodeKey) {
    return null;
  }

  const index = tree.findIndex(node => node.key === nodeKey);

  for (let i = index; i >= 0; i--) {
    if (tree[i].level === 0) {
      return tree[i];
    }
  }

  return null;
};

// 获取自己所属master的状态
const getMasterStatus = (tree, statusMap, nodeKey) => {
  const master = getMaster(tree, nodeKey);

  if (master === null) {
    console.warn(`节点${nodeKey}无父节点，树形结构可能有误，请检查`);

    return true;
  }

  const masterKey = master.key;

  return !!statusMap[masterKey];
};

// 两层树结构
// |- Folder
//    |- Node-1
//    |- Node-2
// |- Folder
const Tree = (props) => {
  const {
    tree = [], loading, activeKey, onSelect,
    defaultActiveKey, keywords, searchStatus
  } = props;

  // 文件夹的开关状态，默认所有都是关
  const [folderStatus, setFolderStatus] = useState({});

  useEffect(() => {
    // 在搜索栏选中某个元素时，进行定位
    // 如果该文件父级的文件夹未打开，则打开它
    if (!activeKey) {
      return;
    }
    const masterKey = getMaster(tree, activeKey);

    if (!masterKey) {
      Object.keys(folderStatus).forEach(element => {
        folderStatus[element] = false;
      });
      folderStatus[activeKey.key] = true;
      setFolderStatus({...folderStatus});

      return;
    }

    Object.keys(folderStatus).forEach(element => {
      folderStatus[element] = false;
    });
    folderStatus[masterKey.key] = true;
    setFolderStatus({...folderStatus});
  }, [searchStatus]);

  useEffect(() => {
    const one = tree.find(item => item.key === defaultActiveKey);

    if (!one) {
      return;
    }

    let item;

    if (one.level === 0) {
      item = one;
    }

    if (one.level === 1) {
      item = getMaster(tree, one.key);
    }

    folderStatus[item.key] = true;
    setFolderStatus({...folderStatus});

    setTimeout(() => {
      const key = `tree-node-${item.key}`;
      const elements = document.getElementsByClassName(key);

      if (!elements || elements.length === 0) {
        return;
      }

      const dom = elements[0];

      scrollIntoView(dom);
    }, 100);
  }, []);

  return (
    <Spin spinning={loading} className="file-tree">
      <ul className="tree-ul">
        {
          tree.map(item => {
            const isMaster = item.level === 0;
            const isSlave = item.level === 1;

            if (isSlave) {
              const isOpen = getMasterStatus(tree, folderStatus, item.key);

              if (!isOpen && !searchStatus) {
                return true;
              }
            }

            let itemText = item.title;

            if (searchStatus) {
              const _itemKeyIndex = itemText.toLowerCase().indexOf(keywords.toLowerCase());

              if (_itemKeyIndex >= 0) {
                const _key = itemText.substr(_itemKeyIndex, keywords.length);

                itemText = itemText.replace(
                  _key, "<span style='background-color:rgb(233, 242, 250);" +
                    "color: red; padding:0px 2px;'>" + _key + '</span>'
                );
              }
            }

            return (
              <li
                key={item.key}
                onClick={() => {
                  if (isMaster && !searchStatus) {
                    folderStatus[item.key] = !folderStatus[item.key];
                    setFolderStatus({...folderStatus});

                    return;
                  }
                  item.key && onSelect(item.key);
                }}
                className={
                  classnames({
                    master: isMaster,
                    slave: isSlave,
                    active: activeKey === item.key,
                    [`tree-node-${item.key}`]: true
                  })
                }
              >
                {
                  (isMaster && folderStatus[item.key]) && (
                    <FolderOpenOutlined />
                  )
                }
                {
                  (isMaster && !folderStatus[item.key]) && (
                    <FolderOutlined />
                  )
                }
                <span className="title" dangerouslySetInnerHTML={{__html: itemText}}></span>
              </li>
            );
          })
        }
      </ul>
    </Spin>
  );
};

Tree.propTypes = {
  loading: PropTypes.bool,
  tree: PropTypes.arrayOf(PropTypes.shape({
    title: PropTypes.string,
    level: PropTypes.number,
    icon: PropTypes.string,
    key: PropTypes.string
  })),
  activeKey: PropTypes.string,
  defaultActiveKey: PropTypes.string,
  onSelect: PropTypes.func,
  keywords: PropTypes.string,
  searchStatus: PropTypes.bool
};

export default Tree;
