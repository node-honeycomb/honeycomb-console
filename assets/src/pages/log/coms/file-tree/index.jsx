import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {Spin} from 'antd';

import './index.less';

const FileTree = (props) => {
  const {tree = [], loading, activeKey, onSelectFile} = props;

  return (
    <Spin spinning={loading} className="file-tree">
      <ul className="tree-ul">
        {
          tree.map(item => {
            return (
              <li
                key={item.key}
                onClick={() => item.key && onSelectFile(item.key)}
                className={
                  classnames({
                    master: item.level === 0,
                    slave: item.level === 1,
                    active: activeKey === item.key
                  })
                }
              >
                {
                  item.icon
                }
                <span className="title">
                  {
                    item.title
                  }
                </span>
              </li>
            );
          })
        }
      </ul>
    </Spin>
  );
};

FileTree.propTypes = {
  loading: PropTypes.bool,
  tree: PropTypes.arrayOf(PropTypes.shape({
    title: PropTypes.string,
    level: PropTypes.number,
    icon: PropTypes.string
  })),
  activeKey: PropTypes.string,
  onSelectFile: PropTypes.func
};

export default FileTree;
