import React from 'react';
import PropTypes from 'prop-types';
import Tree from '@coms/tree';

import './index.less';

const FileTree = (props) => {
  return (
    <Tree {...props} />
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
