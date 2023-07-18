import React, {useState} from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import {Modal, notification, Alert, message} from 'antd';

import api from '@api/index';
import {removeModalDOM} from '@lib/util';

const getPercent = (a, b) => {
  if (!b) {
    return '0%';
  }

  return ((a / b) * 100).toFixed(2) + '%';
};

const enableStorage = window.CONFIG.enableStorage;

const UploadModal = (props) => {
  const {file, onFinish, clusterName, clusterCode} = props;
  const [visisble, setVisible] = useState(true);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({
    loaded: 0,
    total: 0
  });

  const uploadFinish = progress.loaded === progress.total;

  const onCancel = () => {
    if (loading) {
      return message.warn('应用发布中，不可退出！');
    }

    setVisible(false);
    onFinish();
    close();
  };

  const onProgress = (loaded, total) => {
    setProgress({
      loaded,
      total,
    });
  };

  const onOk = async () => {
    setLoading(true);
    try {
      setError(null);
      if (enableStorage) {
        // console.log('prepare upload', file);
        // 获取临时提交地址
        const data = await api.appApi.getTmpUploadUrl(clusterCode, file);
        console.log('>>> get tmp url', data);
        // 发起提交
        await api.appApi.uploadTmpPkg(data.url, file, onProgress);
        console.log('>>> upload tmp package successfully');
        // call tmp publish api
        await api.appApi.publishTmp(clusterCode, data.pkgKey);
        console.log('>>> publish tmp package successfully');
      } else {
        await api.appApi.upload(clusterCode, file, onProgress);
      }
      message.success('应用发布成功！');
      onCancel();
      onFinish();
    } catch (e) {
      setError(e);

      notification.error({
        message: '发布应用失败',
        description: e.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visisble}
      title="发布应用"
      onOk={onOk}
      onCancel={onCancel}
      confirmLoading={loading}
      okText={error ? '重试' : '确定'}
    >
      {
        error && (
          <Alert
            message="应用发布失败"
            description={
              <span className="error-tips">
                {error.message}
              </span>
            }
            type="error"
          />
        )
      }
      {
        (!error && !loading) && (
          <span className="upload-tips tips">
            确定发布应用到集群{clusterName}（{clusterCode}）?
          </span>
        )
      }
      {
        (!error && loading && !uploadFinish) && (
          <span className="filing-tips tips">
            文件上传中{getPercent(progress.loaded, progress.total)}
          （{progress.loaded} / {progress.total}）
          </span>
        )
      }
      {
        (!error && loading && uploadFinish) && (
          <span className="publishing-tips tips">
            应用发布中...
          </span>
        )
      }
    </Modal>
  );
};

UploadModal.propTypes = {
  file: PropTypes.object,
  onFinish: PropTypes.func,
  close: PropTypes.func,
  clusterName: PropTypes.string,
  clusterCode: PropTypes.string

};

export default ({
  file,
  onFinish,
  clusterName,
  clusterCode
}) => {
  const div = document.createElement('div');

  const close = () => removeModalDOM(div);

  ReactDOM.render(
    <UploadModal
      file={file}
      onFinish={onFinish}
      clusterName={clusterName}
      clusterCode={clusterCode}
      close={close}
    />,
    div
  );

  document.body.appendChild(div);
};
