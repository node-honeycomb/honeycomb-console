import React from 'react';
import PropTypes from 'prop-types';
import TreeSearchVersion from '@coms/tree-search-version';

const SearchTree = (props) => {
  return (
    <TreeSearchVersion {...props} />
  );
};

SearchTree.propTypes = {
  loading: PropTypes.bool,
  tree: PropTypes.arrayOf(PropTypes.shape({
    title: PropTypes.string,
    level: PropTypes.number,
    icon: PropTypes.string,
    key: PropTypes.string
  })),
  onSelect: PropTypes.func,
  keywords: PropTypes.string
};

export default SearchTree;
