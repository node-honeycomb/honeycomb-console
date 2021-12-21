import React from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import {Tooltip, Modal, Table, message, notification} from 'antd';

import apis from '../../../../services';

const VersionExit = (props) => {
  const {version, clusterCode} = props;

  if (!version) {
    return null;
  }

  let errorExitCount = 0;
  const errorExitRecord = [];

  version.cluster.forEach(cluster => {
    errorExitCount += cluster.errorExitCount;
    const ip = cluster.ip;

    cluster.errorExitRecord.forEach(time => {
      errorExitRecord.push({
        ip,
        time
      });
    });
  });

  if (!errorExitCount) {
    return null;
  }

  const columns = [
    {
      dataIndex: 'ip',
      title: 'ip'
    },
    {
      dataIndex: 'time',
      title: '退出时间',
      render(text) {
        return moment(text).format('YYYY-MM-DD HH:mm:ss');
      }
    }
  ];


  const onModal = () => {
    Modal.confirm({
      width: '40%',
      title: '应用近期退出情况',
      content: (() => {
        return (
          <Table
            columns={columns}
            dataSource={errorExitRecord}
            pagination={false}
            scroll={{y: 400}}
          />
        );
      })(),
      okText: '关闭',
      cancelText: '清空记录',
      onCancel: async () => {
        try {
          await apis.appApi.cleanAppExit(clusterCode, version.appId);

          message.success(`清除成功！`);
        } catch (e) {
          notification.error({
            message: '操作失败！',
            description: e.message
          });
        }
      }
    });
  };

  return (
    <Tooltip title={`该应用近期退出${errorExitCount}次，请点击查看详情！`}>
      <span
        className="version-exit"
        onClick={() => onModal()}
      >
        <div>
          ({errorExitCount})
        </div>
      </span>
    </Tooltip>
  );
};

VersionExit.propTypes = {
  version: PropTypes.shape({
    cluster: PropTypes.arrayOf(PropTypes.shape({
      errorExitCount: PropTypes.number,
      // 对应的是应用退出的日期，是 new Date().toString() 的值，记得moment转一下
      errorExitRecord: PropTypes.arrayOf(PropTypes.string),
      expectWorkerNum: PropTypes.number,
      ip: PropTypes.string,
      status: PropTypes.string,
      workerNum: PropTypes.number
    })),
    isCurrWorking: PropTypes.bool,
    version: PropTypes.string,
    appId: PropTypes.string
  }),
  clusterCode: PropTypes.string
};

export default VersionExit;
