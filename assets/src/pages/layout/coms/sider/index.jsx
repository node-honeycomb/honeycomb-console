import React from 'react';
import classnames from 'classnames';
import {Link} from 'dva/router';

import WhiteSpace from '@coms/white-space';

import menu from './menu';

import './index.less';

const Sider = () => {
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

export default Sider;
