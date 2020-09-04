/* eslint-disable camelcase */
import React, {useState, useCallback} from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import {Modal, Form, Input, message, Select} from 'antd';
import notification from '@coms/notification';
import _ from 'lodash';
import {tryParse, tryArrToStr} from '@lib/util';
import {aclApi} from '@api';

const layout = {
  labelCol: {span: 4},
  wrapperCol: {span: 20},
};

const DEFAULT_APP = {
  name: '*',
  title: '*（所有APP）',
};

const AuthAdd = (props) => {
  const [form] = Form.useForm();
  const [comfirmLoading, setComfirmLoading] = useState(false);
  const [visible, setVisible] = useState(true);
  const appList = _.get(props, 'appList');
  const row = _.get(props, 'row');
  const selectedCluster = _.get(props, 'selectedCluster');

  const isAdd = _.isEmpty(row) || row === undefined;

  const onSubmit = () => {
    form.validateFields().then(async (value) => {
      setComfirmLoading(true);

      try {
        const values = {
          name: value.name,
          cluster_admin: value.cluster_admin,
          apps: tryArrToStr(value.apps),
          cluster_code: selectedCluster.code,
          cluster_id: selectedCluster.id,
          cluster_name: selectedCluster.name,
        };

        await aclApi.createAcl(values);

        message.success('权限添加成功');
      } catch (error) {
        notification.error({
          message: '添加失败',
          description: error.message,
        });
      } finally {
        setComfirmLoading(false);
        onClose();
      }
    });
  };

  const onUpdate = () => {
    form.validateFields().then(async (value) => {
      setComfirmLoading(true);
      try {
        const values = {
          acl: {
            id: row.id,
            name: value.name,
            cluster_admin: value.cluster_admin,
            apps: tryArrToStr(value.apps),
            cluster_code: selectedCluster.code,
            cluster_id: selectedCluster.id,
            cluster_name: selectedCluster.name,
            gmt_create: row.gmt_create,
            gmt_modified: row.gmt_modified,
          },
          clusterCode: selectedCluster.code,
        };

        await aclApi.updateAcl(row.id, values);

        message.success('权限更新成功');
      } catch (error) {
        notification.error({
          message: '更新失败',
          description: error.message,
        });
      } finally {
        setComfirmLoading(false);
        onClose();
      }
    });
  };

  const onClose = useCallback(() => {
    setVisible(false);
    _.isFunction(props.getAclList) && props.getAclList();
  });

  return (
    <Modal
      okText="确定"
      cancelText="取消"
      onOk={isAdd ? onSubmit : onUpdate}
      confirmLoading={comfirmLoading}
      title={isAdd ? '添加权限' : '编辑权限'}
      visible={visible}
      onCancel={onClose}
      destroyOnClose={true}
    >
      <Form form={form} {...layout}>
        <Form.Item
          label="用户:"
          name="name"
          initialValue={_.get(props, 'row.name')}
          rules={[{required: true, message: '集群显示名不能为空！'}]}
        >
          <Input placeholder="请填写用户名" />
        </Form.Item>
        <Form.Item
          label="权限:"
          name="cluster_admin"
          initialValue={_.get(props, 'row.cluster_admin', 0)}
        >
          <Select style={{width: 120}}>
            <Select.Option value={1}>管理员</Select.Option>
            <Select.Option value={0}>普通用户</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item
          label="拥有的APP:"
          name="apps"
          rules={[{required: true, message: '应用列表不能为空！'}]}
          initialValue={tryParse(_.get(props, 'row.apps'), [])}
        >
          <Select mode="multiple">
            {[...appList, DEFAULT_APP].map((app) => {
              if (app.name === '__ADMIN__') {
                return null;
              }

              return (
                <Select.Option key={app.name}>
                  {app.title || app.name}
                </Select.Option>
              );
            })}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

AuthAdd.propTypes = {
  getAclList: PropTypes.func,
};

export default (props) => {
  const div = document.createElement('div');

  ReactDOM.render(<AuthAdd {...props} />, div);

  document.body.appendChild(div);
};
