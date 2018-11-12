'use strict';

var React = require('react');
let connect = require('react-redux').connect;
let classnames = require('classnames');
let moment = require('moment');
import { Modal, Button, Table, Icon, Tag, Select } from 'antd';
const confirm = Modal.confirm;
const Option = Select.Option;
require('./list.less');
let AppDetailModal = require('./app-detail-modal.jsx');
let ErrorMsgModal = require('./error-msg-modal.jsx');
let DeleteAllModal = require('./delelte-all-modal.jsx');
let OnlineListModal = require('./online-list-modal');
const URL = require("url");
class List extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      admVisible:false,
      emmVisible:false,
      deleteAllVisible:false,
      index: "",
      starting: null,
      int: null,
      message: null,
      name: null,
      version: null,
      isDelete:false,
      filterList:{},
      dataSource: [],
      rowSpan:{},
      deleteAppName: null,
      clearList: {},
      isShowClearListModal: false
    }
    this.keepOnlineNum = _.get(window, ['appManageConfig', 'keepOnlineNum']); //保留的在线版本数量
    this.keepOfflineNum = _.get(window, ['appManageConfig', 'keepOfflineNum']); //保留的离线版本数量
  }
  genRowspan = (appList, data) => {
    let rowSpan ={};
    appList.map((value,key)=>{
      rowSpan[value.name] = {};
      let num = 0;
      rowSpan[value.name].index = _.findIndex(data, (item) => {
        return item.name === value.name;
      });
      data.forEach((item, index) => {
        if (item.name === value.name) {
          num++;
        }
      });
      rowSpan[value.name].num = num;
    })
    return rowSpan
  }
  setListInterval = (that) => {
    let clusterCode = URL.parse(window.location.href, true).query.clusterCode;
    if(!_.isEmpty(clusterCode)){
      window.int = setInterval(function() {
        that.props.getAppList({ clusterCode: clusterCode })
      }, 3000);
    }
  }
  genClearList = (value) => {
    let clearList = {};
    value.forEach(data => {
      let _onlineList = data.versions.filter((item, index) => {
        if(_.get(item, 'cluster[0].status') === 'online') return item;
      });
      let _offlineList = data.versions.filter((item, index) => {
        if(_.get(item, 'cluster[0].status') === 'offline') return item;
      });
      if(_onlineList.length > this.keepOnlineNum || _offlineList.length > this.keepOfflineNum) clearList[data.name] = data.versions;
    });
    return clearList
  }
  componentDidMount = () => {
    let that = this;
    let clusterCode = URL.parse(window.location.href, true).query.clusterCode;
    this.props.getAppList({ clusterCode: clusterCode }).then(d => {
      if(d.success && d.success.length > 0) {
        let clearList = this.genClearList(d.success);
        if(!_.isEmpty(clearList)) {
          this.setState({
            clearList,
            isShowClearListModal: true
          })
        }else{
          this.setListInterval(that);
        }
      }
    })
  }

  componentWillReceiveProps = (nextProps) => {
    if(this.props.location.query.clusterCode !== nextProps.location.query.clusterCode){
      let clusterCode = URL.parse(window.location.href, true).query.clusterCode;
      let that = this;
      this.setState({
        filterList: {},
      })
      if(window.int){
        clearInterval(window.int);
      }
      this.props.getAppList({ clusterCode: clusterCode })
      this.setListInterval(that);
    }
    let newState = _.cloneDeep(this.state);
    let newFilterList = _.cloneDeep(nextProps.appMeta.filterList);
    let oldFilterList = newState.filterList;
    if(!_.isEmpty(newFilterList)){
      _.map(newFilterList,(value, key)=> {
        value.status = _.get(oldFilterList, [key, 'status']) || 'hide';
      })
    }
    this.setState({
      filterList: newFilterList,
    })
  }

  componentWillUnmount = () => {
    clearInterval(window.int);
  }
  changeMonitorData = (gap = null) => {
    let fromTime = moment().format("YYYY-MM-DD-HH");
    let toTime = moment().format("YYYY-MM-DD-HH");
    if (gap) {
      fromTime = moment().subtract(gap, 'hours').format("YYYY-MM-DD-HH")
    }
    let param = {
      from: fromTime,
      to: toTime,
      clusterCode: URL.parse(window.location.href, true).query.clusterCode
    }
    return this.props.queryAppUsages(param);
  }
  showModal = (record) => {
    clearInterval(window.int);
    let index = record.appId;
    this.setState({
      index: index
    })
    this.changeMonitorData().then(() => {
      this.setState({
        admVisible: true
      })
    })
  }
  handleOk = (e) => {
    this.setState({
      admVisible: false,
      emmVisible:false,

    });
    let that = this;
    this.setListInterval(that);
  }
  handleCancel = (e) => {
    let clusterCode = URL.parse(window.location.href, true).query.clusterCode;
    this.setState({
      admVisible: false,
      emmVisible:false,
      deleteAllVisible:false,
      isShowClearListModal: false
    });
    let that = this;
    this.props.getAppList({ clusterCode: clusterCode })
    this.setListInterval(that);
  }
  showConfirm = (operation, name) => {
    let clusterCode = URL.parse(window.location.href, true).query.clusterCode;
    let title = null;
    let content = null;
    let handleApp = null;
    switch (operation) {
      case 'delete':
        title = '确定要删除'+name+'吗?';
        content = '无法复原，请谨慎操作';
        handleApp = () => {
          this.props.deleteApps({ clusterCode: clusterCode }, { appId: name }).then(() => {
            this.setState({ isDelete: true });
            this.props.getAppList({ clusterCode: clusterCode });
          })
        };
        break;
      case 'stop':
        title = '确定要停止'+name+'吗?';
        handleApp = () => {
          this.setState({
            starting: 'stopping',
            index: name
          });
          this.props.stopApps({ clusterCode: clusterCode }, { appId: name }).then(() => {
            this.props.getAppList({ clusterCode: clusterCode }).then(() => {
              this.setState({
                starting: null,
                index:null
              });
            })
          })
        };
        break;
      case 'start':
        title = '确定要启动'+name+'吗?';
        handleApp = () => {
          this.setState({
            starting: 'starting',
            index: name
          });
          this.props.startApps({ clusterCode: clusterCode }, { appId: name }).then(() => {
            this.props.getAppList({ clusterCode: clusterCode }).then(() => {
              this.setState({
                starting: null,
                index:null
              });
            })
          })
        };
        break;
      case 'reload':
        title = '确定要重新启动'+name+'吗?';
        handleApp = () => {
          this.setState({
            starting: 'reloading',
            index: name
          });
          this.props.reloadApps({ clusterCode: clusterCode }, { appId: name }).then(() => {
            this.props.getAppList({ clusterCode: clusterCode }).then(() => {
              this.setState({
                starting: null,
                index:null
              });
            })
          })
        };
        break;
    }
    confirm({
      title: title,
      content: content,
      onOk() {
        handleApp();
      },
      onCancel() {},
    });
  }
  showErrorMsg = (message,record) => {
    clearInterval(window.int);
    this.setState({
      message: message,
      name: record.name,
      errorAppId: record.appId,
      emmVisible: true,
      version: record.version+'_'+record.buildNum
    })
  }

  openDeleteAllModal = (appName) =>{
    clearInterval(window.int);
    this.setState({
      deleteAllVisible: true,
      deleteAppName: appName
    })
  }

  generateColumns = (rowSpan) => {
    let columns = [{
      title: 'name',
      dataIndex: 'name',
      className:'name-wrap',
      render: (text, record, index) => {
        let needExpand = _.get(this.state.filterList,[record.name]).hide.length !== _.get(this.state.filterList,[record.name]).show.length;
        //除去最新的3个版本的列表
        let oldList = _.differenceBy(_.get(this.state.filterList,[record.name, 'show']), _.get(this.state.filterList,[record.name, 'lastThree']), 'appId');
        //停用oldList列表中offline的版本
        let deleteList = oldList.filter((v,k)=>{return v.cluster[0].status === 'offline'});
        const obj = {
          children: (
            <div>
              {text}
              {needExpand
              ?_.get(this.state.filterList,[record.name, 'status'])==="hide"
                ?<Icon title={'展开全部'} onClick={this.changeExpandStatus.bind(this, record.name, "show")} className="expand-btn app-btn" type="plus-square-o" />
                :<Icon title={'收起offline'} onClick={this.changeExpandStatus.bind(this, record.name, "hide")} className="expand-btn app-btn" type="minus-square-o" />
              : null}
              {deleteList.length > 0
              ?<i title={'清理'} onClick={this.openDeleteAllModal.bind(this, record.name)} className="iconfont app-btn">&#xe691;</i>
              : null}
            </div>
          ),
          props: {},
        };
        _.forEach(rowSpan, (value, key) => {
          if (index === value.index) {
            obj.props.rowSpan = value.num;
          }
          if (index > value.index && index < (value.index + value.num)) {
            obj.props.rowSpan = 0;
          }
        })
        return obj;
      }
    }, {
      title: 'version',
      className: "version-wrap",
      render: (text, record, index) => {
        return (
          <div className="version-text">
            <li onClick={this.showModal.bind(this,record)}>{record.version}_{record.buildNum}</li>
          </div>

        )
      }
    }, {
      title: 'proc num',
      render: (text, record) => {
        let workerNum = 0;
        let expectWorkerNum = 0;
        record.cluster.forEach((value, key) => {
          workerNum += value.workerNum || 0;
          expectWorkerNum += value.expectWorkerNum || 0;
        })
        return (
          <li>{workerNum}/{expectWorkerNum}</li>
        )
      }
    }, {
      title: 'publish at',
      dataIndex: 'publishAt'
    }, {
      title: 'status',
      render: (text, record, index) => {
        let that = this;
        let errorflag = true;
        let errorExitMsg = [];
        let errorExitCountAll = 0;
        let appId = record.appId;
        record.cluster.forEach((value, key) => {
          if (record.cluster[key + 1] && value.status !== record.cluster[key + 1].status) {
            errorflag = false;
          }
          if (value.errorExitCount) {
            errorExitMsg.push(value);
          }
        })
        _.map(errorExitMsg,(value, key)=>{
          errorExitCountAll += value.errorExitCount;
        })
        function colorChoose(value) {
          if (value === 'online') {
            return "green"
          } else if (value === 'offline') {
            return "lightgray"
          } else {
            return "orange"
          }
        }
        function errorFlag(that){
          if(errorflag){
            return(
              <div className="status-inline">
                <Tag color={colorChoose(record.cluster[0].status)}>{that.state.starting && appId === that.state.index?that.state.starting:record.cluster[0].status}
                </Tag>
                <span>
                  {record.isCurrWorking?<Icon className="workingBtn" type="check-circle-o" />:null}
                </span>
                {errorExitMsg.length?
                <span className="errMsg">
                  <a onClick={that.showErrorMsg.bind(that,errorExitMsg,record)}><Icon type="exclamation-circle-o" /> [{errorExitCountAll}]
                  </a>
                </span>:null}
              </div>
            )
          }else{
            return record.cluster.map((value,key)=>{
              return(
                <div className="status-block" key={"statusList"+key}>
                  <span>{value.ip}</span>
                  <Tag color={colorChoose(value.status)}>{that.state.starting && appId === that.state.index?that.state.starting:value.status}
                  </Tag>
                  <span>{record.isCurrWorking?<Icon className="workingBtn" type="check-circle-o" />:null}</span>
                  {value.errorExitCount?
                  <span className="errMsg">
                    <a onClick={that.showErrorMsg.bind(that,[value],record)}>
                      <Icon type="exclamation-circle-o" /> [{value.errorExitCount}]
                    </a>
                  </span>:null}
                </div>
              )
            })
          }
        }
        return (
          <div key={"status"+index}>
            {errorFlag(that)}
          </div>
        )
      }
    }, {
      title: 'action',
      render: (text, record, index) => {
        function statusFlag(status) {
          return _.find(record.cluster, (item) => {
            return item.status === status
          })
        }
        let deleteClass = classnames({
          btnHidden: statusFlag("giveup") || !statusFlag("offline"),
          'delete-btn': true
        })
        let startClass = classnames({
          btnHidden: statusFlag("giveup") || !statusFlag("offline"),
          'start-btn': true
        })
        let stopClass = classnames({
          btnHidden: !statusFlag("giveup") && statusFlag("offline"),
          'stop-btn': true
        })
        let reloadClass = classnames({
          btnHidden: statusFlag("giveup") || statusFlag("offline"),
          'reload-btn': true
        })
        let disabled = false;
        if(record.name === "__ADMIN__" || record.name === "__PROXY__"){
          return(
            <li key={"action"+index}></li>
          )
        }else{
          return (
            <li key={"action"+index}>
              <Button size="small" onClick={this.showConfirm.bind(this,"delete",record.appId)} className={deleteClass} type="danger" ghost>delete</Button>
              <Button size="small" onClick={this.showConfirm.bind(this,"start",record.appId)} className={startClass} type="primary" ghost>start</Button>
              <Button size="small" onClick={this.showConfirm.bind(this,"stop",record.appId)} className={stopClass} type="danger" ghost>stop</Button>
              <Button size="small" onClick={this.showConfirm.bind(this,"reload",record.appId)} className={reloadClass} type="primary" ghost>reload</Button>
            </li>
          )
        }
      }
    }, ]
    return columns;
  }
  rowClassName = (rowSpan, record, index) => {
    let keyArray = _.keys(rowSpan);
    let className = "";
    if(rowSpan[record.name].num === 1){
      className += ' border-bottom';
    }else{
      if(index === rowSpan[record.name].index){
        if(index === rowSpan[_.last(keyArray)].index){
          className += 'last ';
        }
        className += 'first-wrap';
      }else if(index === (rowSpan[record.name].index + rowSpan[record.name].num -1)){
        className += 'last-wrap';
      }
    }
    return className;
  }

  changeExpandStatus = (name,status) => {
    let newState = _.cloneDeep(this.state);
    newState.filterList[name].status = status;
    this.setState(newState);
  }
  render() {
    let appList = this.props.appMeta.appList
    let data = [];
    _.map(this.state.filterList, (value, key) => {
      data = _.concat(data, value[value.status]);
    })
    let rowSpan = this.genRowspan(appList, data);
    return (
      <div className="list-wrap">
        <OnlineListModal
          visible = {this.state.isShowClearListModal}
          onHide={this.handleCancel}
          clearList={this.state.clearList}
          stopApps={this.props.stopApps}
          filterList={this.props.appMeta.filterList}
          deleteApps={this.props.deleteApps}
          genClearList={this.genClearList}
          getAppList={this.props.getAppList}
          deleteApps={this.props.deleteApps}
          keepOnlineNum={this.keepOnlineNum}
          keepOfflineNum={this.keepOfflineNum}
        />
        <div className="list-table-wrap">
          <Table
          pagination = {false}
          dataSource={data}
          columns={this.generateColumns(rowSpan)}
          rowClassName={this.rowClassName.bind(this, rowSpan)}
          />
          <AppDetailModal
            visible = {this.state.admVisible}
            index = {this.state.index}
            changeMonitorData = {this.changeMonitorData}
            monitorMeta = {this.props.monitorMeta}
            onHide={this.handleOk}
          />
          <ErrorMsgModal
            visible = {this.state.emmVisible}
            onHide={this.handleCancel}
            message={this.state.message}
            name={this.state.name}
            appId={this.state.errorAppId}
            version={this.state.version}
            cleanAppExitRecord={this.props.cleanAppExitRecord}
          />
          <DeleteAllModal
            visible = {this.state.deleteAllVisible}
            onHide={this.handleCancel}
            deleteAppName={this.state.deleteAppName}
            filterList={this.props.appMeta.filterList}
            deleteApps={this.props.deleteApps}
          />
        </div>
      </div>
    )
  }
}

let mapStateToProps = (store) => {
  let appMeta = store.app;
  let monitorMeta = store.monitor;
  return {
    appMeta,
    monitorMeta
  }
}

let actions = require("../../actions");

module.exports = connect(mapStateToProps, {
  getAppList: actions.app.getAppList,
  deleteApps: actions.list.deleteApps,
  stopApps: actions.list.stopApps,
  startApps: actions.list.startApps,
  reloadApps: actions.list.reloadApps,
  queryAppUsages: actions.monitor.queryAppUsages,
  cleanAppExitRecord: actions.list.cleanAppExitRecord
})(List);
