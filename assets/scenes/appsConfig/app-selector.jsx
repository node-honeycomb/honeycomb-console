import React from 'react';
import {Select} from 'antd';
import PropTypes from 'prop-types';
import _ from 'lodash';
const Option = Select.Option;

/**
 * @author cctv1005s
 * @date 2018-04-24 11:04:22
 * @description 用于选择region和app并传回config
 *   +----------------+ +-------------+
 *   | Region Selector| |App Selector |
 *   +----------------+ +-------------+
 */
class AppSelector extends React.Component {
  state = {
    apps: [],
    clusterCode: this.props.defaultCluster || null,
    defaultApp: '请选择app',
  }

  constructor(p) {
    super(p);
    if (this.props.defaultCluster) {
      this.handleCluster(this.props.defaultCluster);
    }
  }

  handleCluster = (value) => {
    const request = this.props
      .getAppList({
        clusterCode: value
      })
      .then(result => {
        let apps = _.get(result, 'success');
        apps = apps.filter(app => {
          return app.name !== '__ADMIN__' && app.name !== '__PROXY__';
        });
        this.setState({
          apps: apps,
          clusterCode: value,
          defaultApp: apps[0].name
        }, () => {
          if (this.state.defaultApp) {
            this.handleApp(this.state.defaultApp);
          }
        });
      });
    this.props.onRequest(request);
  }

  /**
   * 处理选择app函数
   *
   * @param {string} appValue 一般是这样的值: appName_type, 如果没有type则默认是app
   */
  handleApp = (appValue) => {
    const appId = appValue.split('_')[0];
    const type = appValue.split('_')[1];

    const {clusterCode} = this.state;
    const request = this.props
      .getAppsConfig(
        {clusterCode: clusterCode, type: type || 'app'},
        {appId: appId}
      )
      .then(data => {
        const config = _.get(data, 'success[0].data');
        this.props.onGetConfig(config, clusterCode, appId);
      });
    this.props.onRequest(request);
  }

  render() {
    const options = this.props
      .clusters
      .map(({name, code}) => {
        return (
          <Option value={code} key={name}>
            {name}({code})
          </Option>
        );
      });
    let {apps} = this.state;
    let typeApps = apps.map(app => ({type: 'app', name: app.name}));
    const rApps = _.concat(typeApps, [
      {
        type: 'server',
        name: 'common'
      }
    ]);

    return (
      <div style={{display: 'inline-block'}}>
        <Select
          defaultValue={this.props.defaultCluster || '选择cluster'}
          onChange={this.handleCluster}
        >
          {
            options
          }
        </Select>
        &nbsp;&nbsp;&nbsp;
        <Select
          onChange={this.handleApp}
          defaultValue={this.state.defaultApp}
          style={{minWidth: 150}}
          key={this.state.defaultApp}
        >
          {
            rApps.map(({name, type}) => {
              return (
                <Option value={`${name}_${type}`} key={`${name}_${type}`}>
                  {
                    name
                  }
                </Option>
              );
            })
          }
        </Select>
      </div>
    );
  }
}

AppSelector.propTypes = {
  clusters: PropTypes.array,
  getAppList: PropTypes.func,
  onGetConfig: PropTypes.func,
  getAppsConfig: PropTypes.func,
  defaultCluster: PropTypes.string,
  onRequest: PropTypes.func,
};

AppSelector.defaultProps = {
  clusters: [],
  getAppList: () => Promise.resolve({}),
  onGetConfig: () => null,
  getAppsConfig: () => Promise.resolve(null),
  defaultCluster: undefined,
  onRequest: () => null,
};

export default AppSelector;
