import PropTypes from 'prop-types';

// 集群描述
export const clusterType = {
  code: PropTypes.string,
  name: PropTypes.string,
  ips: PropTypes.arrayOf(PropTypes.string),
  token: PropTypes.string
};
