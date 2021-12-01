import React, {useState, useEffect} from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import {Table, message, Modal, Popconfirm} from 'antd';
import api from '../../services/index';

const Snapshot = (props) => {
  const {clusterCode} = props;
  const [visible, setVisible] = useState(true);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState([]);

  const init = (async () => {
    setLoading(true);
    const list = await api.clusterApi.getSnapshot(clusterCode);

    setLoading(false);

    setData(list);
  });

  useEffect(() => {
    init();
  }, []);

  const onOk = () => {
    setVisible(false);
  };

  const onCancel = () => {
    setVisible(false);
  };

  /**
   * 删除集群的快照
   */
  const onDeleteSnapshot = async (record) => {
    const {clusterCode, id} = record;

    try {
      await api.clusterApi.deleteSnapshot(
        clusterCode,
        id
      );
      message.success('删除成功！');
      init();
    } catch (e) {
      message.error('删除失败：' + e.message);
    }
  };

  // clusterCode, info, md5, gmt_create as gmtCreate
  const cols = [
    {
      dataIndex: 'clusterCode',
      title: '集群code',
    },
    {
      dataIndex: 'md5',
      title: 'md5'
    },
    {
      dataIndex: 'gmtCreate',
      title: '创建时间'
    },
    {
      dataIndex: 'op',
      title: '操作',
      render(_, record) {
        return (
          <Popconfirm
            title="确认删除？删除后将无法恢复！"
            onConfirm={() => onDeleteSnapshot(record)}
          >
            <a>
              删除
            </a>
          </Popconfirm>
        );
      }
    }
  ];

  return (
    <Modal
      visible={visible}
      onOk={onOk}
      onCancel={onCancel}
      title="集群快照"
      width={800}
    >
      <Table
        columns={cols}
        dataSource={data}
        loading={loading}
        pagination={false}
        footer={null}
      />
    </Modal>
  );
};

Snapshot.propTypes = {
  clusterCode: PropTypes.string,
};


export const openSnapshot = (clusterCode) => {
  const div = document.createElement('div');

  document.body.appendChild(div);

  ReactDOM.render(<Snapshot clusterCode={clusterCode} />, div);
};
export default Snapshot;
