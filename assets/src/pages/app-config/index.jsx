import React, {useState, useEffect} from 'react';
import {withRouter} from 'dva/router';
import PropTypes from 'prop-types';
import {connect} from 'dva';
import qs from 'query-string';

import AppList from './coms/app-list';
import EditAppConfig from './coms/edit-app-config';

import './index.less';


const AppConfig = (props) => {
  const {history, location} = props;
  const [appName, setAppName] = useState(null);
  const [appType, setAppType] = useState('app');

  const setQuery = (o) => {
    const query = qs.parse(location.search);

    Object.keys(o).forEach(key => {
      if (!o[key]) {
        delete query[key];
      }

      query[key] = o[key];
    });

    location.search = qs.stringify(query);

    history.push(location);
  };

  const onSelectApp = (appName) => {
    setQuery({
      configAppName: appName
    });

    if (appName.includes('*')) {
      const [name, type] = appName.split('*');

      setAppName(name);
      setAppType(type);

      return;
    }

    setAppName(appName);
    setAppType('app');
  };

  useEffect(() => {
    // 切换页面时需要取消当前的配置
    const query = qs.parse(location.search);

    const configAppName = query.configAppName;

    if (configAppName) {
      onSelectApp(configAppName);
    }
  }, []);

  return (
    <div className="app-config">
      <div className="app-config-list page-left-side">
        <div className="list-title">应用列表</div>
        <AppList
          onSelect={onSelectApp}
          activeAppName={appName}
          appType={appType}
        />
      </div>
      <div className="page-right-side">
        <EditAppConfig
          appName={appName}
        />
      </div>
    </div>
  );
};

AppConfig.propTypes = {
  history: PropTypes.object,
  location: PropTypes.object,
  dispatch: PropTypes.func,
};

export default withRouter(connect()(AppConfig));
