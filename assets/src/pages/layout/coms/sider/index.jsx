import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {Link, withRouter} from 'dva/router';

import WhiteSpace from '@coms/white-space';


import menu from './menu';

import './index.less';

const getActiveMenuLink = (pathname) => {
  if (!pathname) {
    return null;
  }

  // eslint-disable-next-line
  for (const item of menu) {
    if (!item.link) {
      continue;
    }

    if (pathname.includes(item.link)) {
      return item.link;
    }
  }

  return null;
};

const Sider = (props) => {
  const {location, currentClusterCode} = props;
  const pathname = location.pathname;

  const activeLink = getActiveMenuLink(pathname);

  return (
    <div className="hc-sider">
      {
        menu.map(item => {
          return (
            <div
              className={
                classnames(
                  'sider-menu',
                  {
                    first: item.first,
                    second: !item.first,
                    active: item.link === activeLink
                  }
                )
              }
              key={item.title}
            >
              {
                item.link ? (
                  <Link
                    className="no-color-link"
                    to={`${item.link}?clusterCode=${currentClusterCode}`}
                  >
                    {item.icon}<WhiteSpace />{item.title}
                  </Link>
                ) : item.title
              }
            </div>
          );
        })
      }
    </div>
  );
};

Sider.propTypes = {
  location: PropTypes.object,
  currentClusterCode: PropTypes.string
};

export default withRouter(Sider);
