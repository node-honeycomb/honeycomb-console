import {Icon, Tooltip, Modal, Button, Input, Popconfirm} from 'antd';
import React, {Component} from 'react';
import copy from 'copy-to-clipboard';
import _ from 'lodash';
import classnames from 'classnames';
import OutsideClick from 'react-outsideclick';
import edata from 'edata';
import moment from 'moment';
import PropTypes from 'prop-types';
import './error-center.less';

const {Search} = Input;
const viewState = edata({
  addError: null
});

class Errorcenter extends Component {
  static propTypes = {
    /** 抛错列表做多显示几条数据(默认50条)*/
    listLimit: PropTypes.number,
    img: PropTypes.string
  }

  static defaultProps = {
    listLimit: 50,
    hideQuestionIcon: false
  }

  constructor() {
    super();
    this.state = {
      showWarningBox: false,
      errorData: [],
      errorDataAll: [],
      contentClickId: null,
      copyErrMsgId: null,
      showDetailModal: false,
      detailModalData: null,
      showTooltip: false,
      searchValue: '',
      redIconTip: false,
      errorNotificationId: null,
      message: '',
      isShowBodyDetail: false
    };
    viewState.watch((e) => {
      if (e.path[0] === 'addError') {  // 传值可能是 单个
        this.addErrorData(JSON.stringify(e.data.value));
      }
    });
  }

  addErrorData(e) {
    const getErrCenterData = window.localStorage.getItem('errCenterData');
    let getData = [];

    if (!e) return;

    try {
      let data = JSON.parse(e);
      if (!_.get(data, 'request') && !_.get(data, 'response')) {
        return;
      }

      const settime = {
        showTime: moment().format('YYYY/MM/DD HH:mm'),
        millisecond: moment().valueOf(),
        id: random(getData)
      };
      data = _.assign(data, settime);

      if (getErrCenterData) {
        getData = JSON.parse(getErrCenterData);
      }

      getData = getData ? _.concat(getData, data) : [data];
      getData = _.sortBy(getData, (item) => {
        return -item.millisecond;
      });
      const listLimit = this.props.listLimit;

      if (getData.length > listLimit) {
        getData = getData.slice(0, listLimit);
      }

      window.localStorage.setItem('errCenterData', JSON.stringify(getData));
      if (_.get(data, 'response.message', false)) {
        this.errTips(data);
        clearTimeout(timeout);
        setTimeoutNotification();
      } else {
        this.setState({
          redIconTip: !this.state.showWarningBox
        });
        this.getErrCenterData();
      }
    } catch (err) {
      console.log(err); // eslint-disable-line 
    }

    function random(getData) {
      const num = _.ceil((Math.random() * 9 + 1) * 10000);

      getData && getData.find(v => v.id === num) ? random(getData) : num;

      return num;
    }
  }

  errNotificationShow() {
    const dom = document.getElementsByClassName('errorNotif')[0];

    dom && dom.classList.remove('hideErrNotif');
  }
  errNotificationHide() {
    const dom = document.getElementsByClassName('errorNotif')[0];

    dom && dom.classList.add('hideErrNotif');
  }


  errTips(data) {
    this.errNotificationShow();
    data = {
      message: data.response.message,
      id: data.id
    };

    this.setState({
      errorNotificationId: data.id,
      redIconTip: !this.state.showWarningBox,
      message: data.message
    },
    () => {
      let dom = document.getElementsByClassName('err-center-motifimessage')[0];
      dom.classList.add('click-fadeInUp');
      this.getErrCenterData();
      setTimeout(() => {dom.classList.remove('click-fadeInUp')}, 1000);
    });
  }

  showWarningBox(status) {
    const setState = {};

    setState.showWarningBox = status;
    setState.showTooltip = false;
    setState.redIconTip = false;
    if (status) {
      setState.errorData = this.state.errorDataAll;
      setState.searchValue = '';
      this.errNotificationHide();
    }
    this.setState(setState);
  }

  onClickDelList(id) {
    let dellist = _.get(this.state, 'errorDataAll', []).filter(v => v.id !== id);
    let errData = null;
    if (!_.isEmpty(this.state.errorData)) {
      errData = _.get(this.state, 'errorData', []).filter(v => v.id !== id);
    }
    this.setState({
      errorDataAll: dellist,
      errorData: errData || this.state.errorData
    });
    window.localStorage.setItem('errCenterData', JSON.stringify(dellist));
  }

  copyErrMsg(copyErrMsgId, copyContent) {
    this.setState({copyErrMsgId}, () => {
      copy(JSON.stringify(copyContent));
    });
  }

  onClickDetail(id) {
    const detail = _.find(_.get(this.state, 'errorDataAll', []), (v) => v.id === id);
    this.setState({
      detailModalData: detail,
      showDetailModal: !this.state.showDetailModal,
      contentClickId: _.compact(_.uniq(_.concat(this.state.contentClickId, id))),
      isShowBodyDetail: false
    }, () => {
      let dom = document.getElementsByClassName('ant-modal-mask')[0];
      if (this.state.showDetailModal) {
        dom && dom.classList.add('err-center-modal');
      } else {
        dom && dom.classList.remove('err-center-modal');
      }
    });
  }

  getErrCenterData() {
    const errData = window.localStorage.getItem('errCenterData');

    if (errData === null) {
      this.setState({
        errorData: [],
        errorDataAll: [],
        showWarningBox: false
      });
    }
    try {
      JSON.parse(errData);
      this.setState({
        errorDataAll: JSON.parse(errData),
        errorData: JSON.parse(errData)
      });
    } catch (err) {
      console.log(err); // eslint-disable-line 
    }
  }

  onSearch() {
    if (_.isEmpty(_.get(this.state, 'errorDataAll', []))) {
      return;
    }
    const value = this.state.searchValue;

    if (value) {
      const reg = new RegExp(value, 'g');
      const errData = [];
      const errdata = _.get(this.state, 'errorDataAll', []);

      errdata.forEach(v => {
        if (reg.exec(JSON.stringify(v)) !== null) {
          errData.push(v);
        }
      });
      this.setState({errorData: errData});
    } else {
      this.setState({errorData: _.get(this.state, 'errorDataAll', [])});
    }
  }

  componentDidMount() {
    this.getErrCenterData();
  }

  renderDetail(detaildata, type) {
    const data = {
      Request: detaildata.request || null,
      Response: detaildata.response || null
    };

    return (
      _.map(data, (value, key) => {
        return (
          value && <div key={key} >
            <span className="weight-style">{key}:</span>
            {
              _.map(value, (v, k) => {
                return (
                  <div key={k} className="error-detail">
                    <span className="weight-style">{k}:</span>
                    {
                      k === 'body' && type ?  <span>
                        <span
                          onClick={() => {
                            this.setState({isShowBodyDetail: !this.state.isShowBodyDetail});
                          }}
                          className={classnames('viewbody', {'red-style': k === 'body'})}>
                        (注意保护敏感信息,点击展开)
                        </span>
                        <p
                          className={classnames('hiden-bodydetail', 'dom', {'show-bodydeteil': this.state.isShowBodyDetail})}>
                          <pre>
                            {JSON.stringify(JSON.parse(v), null, '  ')}
                          </pre>
                        </p>
                      </span> : <span className={classnames({'red-style': k === 'rid' || k === 'message'})}>
                        {
                          k === 'headers' ? <pre>{JSON.stringify(v, null, '  ')}</pre> : JSON.stringify(v)
                        }
                      </span>
                    }
                  </div>
                );
              })
            }
          </div>
        );
      })
    );
  }

  renderModal() {
    if (_.isEmpty(_.get(this.state, 'detailModalData', []))) return;

    return (
      <Modal
        wrapClassName = "error-center-modal"
        title="抛错详情"
        visible={_.get(this.state, 'showDetailModal', false)}
        onCancel={() => {
          this.onClickDetail();
        }}
        maskClosable={false}
        width={700}
        footer={
          <Button onClick={() => {
            this.onClickDetail();
          }}>
            关闭
          </Button>
        }
      >
        {
          this.renderDetail(_.get(this.state, 'detailModalData', {}), 'modal')
        }
      </Modal>
    );
  }

  renderErrList() {
    const propsClassName = _.get(this.props, 'clickShowClassNames', []);
    let clickClassName = [
      'ant-btn ant-btn-sm ant-btn-clicked', // clear Popconfirm NoBtn
      'ant-btn ant-btn-sm',
      'ant-popover-buttons',
      'anticon anticon-close-circle-o', // list search-clear icon
      'anticon anticon-exclamation-circle-o drp-iconfont drp-icon-tanhao' // 叹号
    ];

    if (clickClassName) {
      clickClassName = _.concat(clickClassName, propsClassName);
    }

    return (
      <OutsideClick
        className="outsideclick-modal"
        onClickOutside={(e) => {
          if (!_.includes(clickClassName, e.target.className) &&
            !e.target.closest('.errorNotif') &&
            !e.target.closest('.show-warning-info-box') &&
            !e.target.closest('.error-center-modal') &&
            !e.target.closest('.errcenter-errIcon') &&
            !e.target.closest('.clear-search-value') &&
            !e.target.closest('.del-list') // 删除list
          ) {
            this.setState({showWarningBox: false});
          }
        }}>
        <div className={classnames('warning-info-box', {
          'show-warning-info-box': _.get(this.state, 'showWarningBox', false)
        })}>
          <div className="error-center-search">
            <Search
              className="search-box"
              value={_.get(this.state, 'searchValue', '')}
              onChange={(e) => {
                this.setState({searchValue: e.target.value});
              }}
              onSearch={this.onSearch.bind(this)}
              style={{
                width: '100%'
              }}
              suffix={_.get(this.state, 'searchValue', '') ?
                <span className='clear-search-value'
                  onClick={() => {
                    this.setState({searchValue: ''});
                  }}>
                  <Icon type="close-circle-o"/>
                </span> : null}
            />
            <span className="clear-errdata">
              {
                !_.isEmpty(_.get(this.state, 'errorDataAll', [])) ?
                  <Popconfirm
                    overlayClassName='error-center-popconfirm'
                    placement="topRight"
                    title="确认清空列表吗?"
                    onConfirm={() => {
                      window.localStorage.removeItem('errCenterData');
                      this.getErrCenterData();
                    }}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Tooltip title="清空列表" placement="bottom" overlayClassName = "err-cente-clearlist">
                      <Icon type="delete" />
                    </Tooltip>
                  </Popconfirm> :
                  <Tooltip title="清空列表" placement="bottom" overlayClassName = "err-cente-clearlist">
                    <Icon type="delete" />
                  </Tooltip>
              }
            </span>
          </div>
          {
            _.get(this.state, 'errorData', []).map((value, index) => {
              return (
                <div className={classnames('message', {
                  'visited-content': _.includes(_.get(this.state, 'contentClickId', []), value.id)
                })} key={value.id}>
                  <div className="message-title">
                    <div>
                      <span>{value.showTime}</span>
                    </div>
                    <div>
                      <span
                        className='del-list'
                        onClick={() => {
                          this.onClickDelList(value.id);
                        }}>
                        <Icon type="close-circle-o" />
                      </span>
                    </div>
                  </div>
                  <div
                    id={value.id}
                    className={classnames('content', {
                      'visited-content': _.includes(_.get(this.state, 'contentClickId', []), value.id)
                    })}
                    onClick={() => {
                      this.onClickDetail(value.id);
                    }}
                  >
                    {
                      _.get(value.response, 'message') && <div>
                        <span className="weight-style">message:</span>{_.get(value.response, 'message')}
                      </div>
                    }

                    {
                      this.renderDetail(value || {})
                    }
                  </div>
                  <div className="copy-content"
                    onClick={() => {
                      this.copyErrMsg(value.id, {
                        request: value.request, response: value.response
                      });
                    }}>
                    <Tooltip placement="top"
                      overlayClassName = "err-cente-copy"
                      title={_.get(this.state, 'copyErrMsgId', '') === value.id ? '已复制' : '复制'}>
                      <Icon type="copy" />
                    </Tooltip>
                  </div>
                </div>
              );
            })
          }
          {
            _.isEmpty(_.get(this.state, 'errorData', [])) && <div className="empty-error">暂无</div>
          }
        </div>
      </OutsideClick>
    );
  }

  renderErrBox() {
    if (_.isEmpty(_.get(this.state, 'errorDataAll', []))) return;

    return (
      <div className="show-err-box">
        <div className={classnames('icon-box', {
          'show-box-icon': _.get(this.state, 'showWarningBox')
        })}>
          <div className="tip-icon">
            <Tooltip
              onMouseEnter = {() => {
                this.setState({showTooltip: true});
              }}
              onMouseLeave = {() => {
                this.setState({showTooltip: false});
              }}
              visible={_.get(this.state, 'showTooltip', false)}
              placement="left" title="错误列表"
            >
              <span
                className={
                  classnames('errcenter-icon errcenter-errIcon', {'error-red-style': !_.get(this.state, 'showWarningBox') && _.get(this.state, 'redIconTip', false)})
                }
                onClick={() => {
                  this.showWarningBox(!this.state.showWarningBox);
                }}
              >
                {
                  _.get(this.props, 'errorIcon') ? _.get(this.props, 'errorIcon') : <Icon type="exclamation-circle-o"/>
                }
              </span>
            </Tooltip>
            {
              !_.get(this.props, 'hideQuestionIcon', false) && <Tooltip placement="left"
                overlayClassName="error-center-overlay"
                title={<span>
                问题反馈<br />
                  {
                    _.get(this.props, 'qrcode') ? _.get(this.props, 'qrcode') : <Icon type="qrcode" />
                  }
                </span>
                }
              >
                <span className='errcenter-icon errcenter-question'>
                  {
                    _.get(this.props, 'questIcon') ? _.get(this.props, 'questIcon') : <Icon type="question-circle-o" />
                  }
                </span>
              </Tooltip>
            }
          </div>
        </div>
        {this.renderErrList()}
      </div>
    );
  }

  render() {
    return (
      <div className="aliyun-errorcenter">
        {
          <div className="errorNotif hideErrNotif">
            <div className='err-center-motifimessage'>
              <div className="icon-close-circle">
                <Icon type="close-circle-o" />
              </div>
              <div className="show-message"
                onClick={() => {
                  this.showWarningBox(true);
                }} 
              >
                {this.state.message}
              </div>
              <div className="error-detail"
                onClick={() => {
                  this.onClickDetail(_.get(this.state, 'errorNotificationId', ''));
                }}>
                详情
              </div>
            </div>
            <span className='close-err-center-notifi'>
              <Icon type="close-circle-o"
                onClick={() => {
                  this.errNotificationHide();
                }} />
            </span>
          </div>
        }
        {
          this.renderErrBox()
        }
        {
          this.renderModal()
        }
      </div>
    );
  }
}

Errorcenter.add = (code) => {
  viewState.set('addError', code);
};

let timeout = null;

function setTimeoutNotification() {
  let dom = document.getElementsByClassName('errorNotif')[0];
  window.addEventListener('mouseout', function (e) {
    if (e.target && e.target.closest('.errorNotif')) {
      setTime();
    }
  }, true);
  window.addEventListener('mouseover', function (e) {
    if (e.target && e.target.closest('.errorNotif')) {
      clearTimeout(timeout);
    }
  }, true);
  setTime();
  function setTime() {
    timeout = setTimeout(function () {
      dom && dom.classList.add('hideErrNotif');
    }, 5000);
  }
}

export default Errorcenter;
