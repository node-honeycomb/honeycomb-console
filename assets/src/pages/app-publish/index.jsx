import React from 'react';
import {Tabs} from 'antd';
import {connect} from 'dva';
import {withRouter} from 'dva/router';
import PropTypes from 'prop-types';
import qs from 'query-string';

import Publish from './coms/publish';
import './index.less';

const {TabPane} = Tabs;

/**
 *   "tabName": "打包",
 *   "className": "pack-iframe",
 *   "src": "http://honeycomb-dev.alibaba.net/package"
 */
const publishPages = window.CONFIG.publishPages || [];

const AppPublish = (props) => {
  const {location, history} = props;

  const onSelect = (params) => {
    const query = qs.parse(location.search);

    query.activeFrameKey = params;

    location.search = qs.stringify(query);

    history.push(location);
  };

  const {currentClusterCode, currentCluster} = props;
  const query = qs.parse(location.search);
  const hcConsoleEndpoint = encodeURIComponent(window.location.protocol + '//' + window.location.hostname + window.CONFIG.prefix);

  return (
    <div className="app-publish">
      <Tabs
        defaultActiveKey={query.activeFrameKey}
        onChange={onSelect}
      >
        {
          publishPages.map(page => {
            return (
              <TabPane
                tab={page.tabName}
                key={page.tabName}
              >
                <iframe
                  className="publish-iframe"
                  src={`${page.src}?clusterCode=${currentClusterCode}&env=${currentCluster.env}&console=${hcConsoleEndpoint}`}
                />
              </TabPane>
            );
          })
        }
        <TabPane tab="手动发布" key="app-publish">
          <Publish
            clusterCode={currentClusterCode}
            clusterName={currentCluster && currentCluster.name}
          />
        </TabPane>
      </Tabs>
    </div>
  );
};

const mapState2Props = (state) => {
  return {
    currentClusterCode: state.global.currentClusterCode,
    currentCluster: state.global.currentCluster,
  };
};


AppPublish.propTypes = {
  currentCluster: PropTypes.object,
  currentClusterCode: PropTypes.string,
  location: PropTypes.object,
  history: PropTypes.object,
};

export default withRouter(connect(mapState2Props)(AppPublish));
