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
  const location = props.location;
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
                  <Link className="no-color-link" to={item.link}>
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
  location: PropTypes.object
};

export default withRouter(Sider);
