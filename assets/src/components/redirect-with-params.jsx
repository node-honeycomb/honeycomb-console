import React from 'react';
import qs from 'qs';
import PropTypes from 'prop-types';
import {Redirect, withRouter} from 'dva/router';

class RedirectWithParams extends React.Component {
  static propTypes = {
    from: PropTypes.string,
    to: PropTypes.string,
    location: PropTypes.object
  }

  getWithParams = (path) => {
    const {location} = this.props;

    return `${path}?${qs.stringify(location.query)}`;
  }

  render() {
    const {from, to, ...rest} = this.props;

    return (
      <Redirect
        from={this.getWithParams(from)}
        to={this.getWithParams(to)}
        {...rest}
      />
    );
  }
}

export default withRouter(RedirectWithParams);
