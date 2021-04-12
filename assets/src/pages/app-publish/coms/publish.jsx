import React from 'react';
import {Button, Upload} from 'antd';
import PropTypes from 'prop-types';

import {UploadOutlined} from '@ant-design/icons';

import callUploadModal from './upload-modal';


const noop = () => null;

const Publish = (props) => {
  const {clusterName, clusterCode, onFinish = noop} = props;

  const uploadProps = {
    accept: '.tgz',
    beforeUpload: (file) => {
      callUploadModal({
        file,
        onFinish: onFinish,
        clusterCode,
        clusterName
      });

      return false;
    },
    showUploadList: false
  };

  return (
    <div>
      <Upload
        {...uploadProps}
      >
        <Button
          type="primary"
        >
          <UploadOutlined /> 应用发布
        </Button>
      </Upload>
    </div>
  );
};

Publish.propTypes = {
  clusterCode: PropTypes.string,
  onFinish: PropTypes.func,       // 上传结束时的响应函数
  clusterName: PropTypes.string
};

export default Publish;

