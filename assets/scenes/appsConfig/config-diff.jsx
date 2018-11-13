import React from 'react';
import {connect} from 'react-redux';
import {Card, Icon, message, Button} from 'antd';
import PropTypes from 'prop-types';
import _ from 'lodash';
import URL from 'url';
import alpha from 'alpha-order';

import AppSelector from './app-selector';
import actions from '../../actions';
import './config-diff.less';

import * as monaco from 'monaco-editor';

/**
 * 将store中的clusterMeta转换成数组类型的函数
 *
 * 转换前：
 *  clusterMeta {
 *    meta:{
 *      cluster0:{
 *        key: xxx
 *      },
 *      cluster2:{
 *        key: xxx
 *      },
 *    }
 *  }
 *
 * 转换后:
 * [
 *   {
 *    name:xxx,
 *    code:cluster0
 *   }
 * ]
 *
 * @param {*} clusterMeta 存放在store中的clusterMeta
 */
const getClusters = () => {
  const meta = window.clusterList;
  if (!meta) {
    return [];
  }

  return Object.keys(meta).map(key => {
    return {
      name: _.get(meta[key], '.name'),
      code: key
    };
  });
};

// 用于定义一个代码块
const block = () => {
  return {
    config: {}, // 代码块里面的内容, Object
    cluster: null, // 所属的cluster, String
    app: null, // 所属的app, String
    merge: false, // 是否merge了 common 配置
    backup: {}, // 备份，用于从merge恢复到非merge状态
  };
};

/**
 * @author cctv1005s
 * @description 用于比较region之间app的config的差别的一个组件
 * @date 2018-04-24 10:49:39
 */
class ConfigDiff extends React.Component {
  nowCluster = URL.parse(window.location.href, true).query.clusterCode;
  constructor(p) {
    super(p);
    this.state = {
      cluster: [], // cluster列表
      toButton: 500, // 编辑器到高度，默认为 500 px
      origin: block(), // 左边的代码块的信息
      compare: block(), // 右边的代码块的信息
      loading: false, // 是否在加载数据
    };
  }

  // 计算anchor到底部的距离，用于调整编辑器的高度，时刻贴合屏幕底部
  anchorToButton() {
    const box = this.refs.anchor.getBoundingClientRect();
    return window.innerHeight -
           (box.top + window.pageYOffset - document.documentElement.clientTop) -
           10;
  }

  componentDidMount() {
    this.setState({
      toButton: this.anchorToButton()
    }, () => {
      this.diffEditor = monaco.editor.createDiffEditor(this.refs.editor, {
        readOnly: true,
        scrollBeyondLastLine: false,
        automaticLayout: true,
      });
    });

    window.onresize = () => {
      this.setState({
        toButton: this.anchorToButton()
      });
    };
  }

  componentWillUnmount() {
    window.onresize = null;
  }

  /**
   * [合并common配置]的点击函数
   * @param { String } enum{ 'origin', 'compare' }
   */
  handleMerge = (type) => {
    return () => {
      const block = _.get(this.state, type);
      if (block.merge) {
        this.setState((state) => {
          state[type].merge = false;
          state[type].config = _.cloneDeep(state[type].backup);
        }, () => {
          this.makeDiff();
        });
        return;
      }

      if (block) {
        this.loading();
        this.props.getAppsConfig({
          clusterCode: block.cluster,
          type: 'server'
        }, {
          appId: 'common'
        }).then(result => {
          const commonConfig = _.get(result, 'success[0].data');
          this.setState((state) => {
            state[type].merge = true;
            state[type].config = alpha.sort(_.merge(state[type].config, commonConfig));
          }, () => {
            this.makeDiff();
            this.finish();
          });
        });
      }
    };
  }

  makeDiff = () => {
    const {origin, compare} = this.state;
    const originalTxt = JSON.stringify(origin.config, ' ', 2);
    const modifiedTxt = JSON.stringify(compare.config, ' ', 2);
    this.diffEditor.setModel({
      original: monaco.editor.createModel(originalTxt, 'json'),
      modified: monaco.editor.createModel(modifiedTxt, 'json'),
    });
  }

  // 处理 AppSelector 选择app之后传回的config
  handleGetConfig = (type) => {
    if (['origin', 'compare'].indexOf(type) === -1) {
      message.error('错误的选项');
      return () => {};
    }
    return (config, cluster, app) => {
      this.setState({
        [type]: {
          config: _.cloneDeep(alpha.sort(config)),
          cluster,
          app,
          merge: false,
          backup: _.cloneDeep(alpha.sort(config)),
        }
      }, () => {
        this.makeDiff();
      });
    };
  }

  loading = () => {
    this.setState({
      loading: true,
    });
  }

  finish = () => {
    this.setState({
      loading: false,
    });
  }

  /**
   * 在AppSelector中每发出一个ajax请求就会触发这个函数,传回一个Promise
   * @param {Promise} request ajax Promise
   */
  handleRequest = (request) => {
    this.loading();
    request.then(() => {
      this.finish();
    }).catch(e => {
      message.error(e.message || JSON.stringify(e));
      this.finish();
    });
  }

  render() {
    const clusters = getClusters();
    const {origin, compare} = this.state;
    return (
      <div className="config-diff-container">
        <a
          className="back"
          onClick={this.props.onFinish}
        >
          <Icon type="double-left" />
          返回
          &nbsp;
          {
            this.state.loading && (<Icon type="loading">加载中...</Icon>)
          }
        </a>
        <br />

        <Card className="code">
          <div className="code-header">
            <div className="left">
              <AppSelector
                clusters={clusters}
                defaultCluster={this.nowCluster}
                getAppList={this.props.getAppList}
                getAppsConfig={this.props.getAppsConfig}
                onGetConfig={this.handleGetConfig('origin')}
                onRequest={this.handleRequest}
              />
                &nbsp;&nbsp;
              <Button
                type="primary"
                onClick={this.handleMerge('origin')}
              >
                {
                  origin.merge ?
                    '解除合并'
                    :
                    '合并common配置'
                }
              </Button>
            </div>
            <div className="right">
              <Button
                type="primary"
                onClick={this.handleMerge('compare')}
              >
                {
                  compare.merge ?
                    '解除合并'
                    :
                    '合并common配置'
                }
              </Button>
                &nbsp;&nbsp;
              <AppSelector
                clusters={clusters}
                defaultCluster={this.nowCluster}
                getAppList={this.props.getAppList}
                getAppsConfig={this.props.getAppsConfig}
                onGetConfig={this.handleGetConfig('compare')}
                onRequest={this.handleRequest}
              />
            </div>
          </div>
          <div ref="anchor"></div>
          <div ref="editor" style={{width: '100%', height: this.state.toButton}}>
          </div>
        </Card>
      </div>
    );
  }
}

let mapStateToProps = (store) => {
  let clusterMeta = store.cluster;
  return {
    clusterMeta
  };
};

ConfigDiff.propTypes = {
  clusterMeta: PropTypes.object,
  onFinish: PropTypes.func,
  getAppsConfig: PropTypes.func,
  getAppList: PropTypes.func,
};

ConfigDiff.defaultProps = {
  onFinish: () => {}
};

export default connect(mapStateToProps, {
  getAppsConfig: actions.appsConfig.getAppsConfig,
  getAppList: actions.app.getAppList
})(ConfigDiff);
