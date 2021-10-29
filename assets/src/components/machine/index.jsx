import React from 'react';
import _ from 'lodash';
import moment from 'moment';
import PropTypes from 'prop-types';
import {Tooltip, message} from 'antd';
import {PRIMARY_COLOR} from '@lib/color';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import {DesktopOutlined, CloudServerOutlined, NodeIndexOutlined} from '@ant-design/icons';

import BannerCard from '../banner-card';

import './index.less';

const TITLE_MAP = {
  cpu: 'cpu',
  cpuNum: 'cpu数量',
  hostname: '主机名字',
  kernel: '内核版本',
  memory: '内存（G）',
  memoryUsage: '内存使用',
  nodeVersion: 'nodejs版本',
  serverVersion: 'honeycomb版本',
  sysLoad: '系统负载',
  sysTime: '系统时间',
  timezone: '时区',
  uname: '操作系统名称'
};

const TITLE_RENDER = {
  memoryUsage: v => v + '%',
  sysLoad: v => v.join('，'),
  sysTime: v => moment(v).format('YYYY-MM-DD HH:mm:ss')
};

const Machine = (props) => {
  const {ip, data} = props;

  return (
    <BannerCard className="machine">
      <div className="ip-title">
        <DesktopOutlined style={{color: PRIMARY_COLOR}} />
        &nbsp;
        <Tooltip title="点击复制">
          <CopyToClipboard
            text={ip}
            onCopy={() => message.success(`复制成功！`)}
          >
            <span className="ip-to-copy">{ip}</span>
          </CopyToClipboard>
        </Tooltip>
      </div>
      <div className="key-title">基础信息</div>
      <div>
        {
          Object.keys(TITLE_MAP).map(key => {
            if (!data[key]) {
              return null;
            }

            return (
              <div className="machine-keys" key={key}>
                <span className="title">{TITLE_MAP[key]}</span>
                <span className="value">
                  <Tooltip
                    title={data[key]}
                    placement="right"
                  >
                    {
                      TITLE_RENDER[key] ? TITLE_RENDER[key](data[key]) : data[key]
                    }
                  </Tooltip>
                </span>
              </div>
            );
          })
        }
      </div>
      <div className="key-title">磁盘信息</div>
      <div className="log">
        <div className="icon">
          <CloudServerOutlined />
        </div>
        <div>
          <div className="title">
            应用磁盘
          </div>
          <div>
            <span className="s-title">剩余容量</span>：
            {(_.get(data, 'diskInfo.serverRoot.capacity') || 0) * 100}%
            &nbsp;
            <span className="s-title">文件系统</span>：
            {_.get(data, 'diskInfo.serverRoot.filesystem')}
          </div>
        </div>
      </div>
      <div className="log">
        <div className="icon">
          <NodeIndexOutlined />
        </div>
        <div>
          <div className="title">
            日志磁盘
          </div>
          <div>
            <span className="s-title">剩余容量</span>：
            {(_.get(data, 'diskInfo.logsRoot.capacity') || 0) * 100}%
            &nbsp;
            <span className="s-title">文件系统</span>：
            {_.get(data, 'diskInfo.logsRoot.filesystem')}
          </div>
        </div>
      </div>
    </BannerCard>
  );
};

Machine.propTypes = {
  ip: PropTypes.string,
  data: PropTypes.shape({
    cpu: PropTypes.string,
    cpuNum: PropTypes.number,
    diskInfo: PropTypes.shape({
      serverRoot: {
        available: PropTypes.number,
        capacity: PropTypes.number,
        filesystem: PropTypes.string,
        size: PropTypes.number,
        used: PropTypes.number,
      },
      logsRoot: {
        available: PropTypes.number,
        capacity: PropTypes.number,
        filesystem: PropTypes.string,
        size: PropTypes.number,
        used: PropTypes.number,
      }
    }),
    hostname: PropTypes.string,
    kernel: PropTypes.string,
    memory: PropTypes.number,
    memoryUsage: PropTypes.number,
    nodeVersion: PropTypes.string,
    serverVersion: PropTypes.string,
    sysLoad: PropTypes.arrayOf(PropTypes.number),
    sysTime: PropTypes.string,
    timezone: PropTypes.string,
    uname: PropTypes.string
  })
};

/**
  示例数据:
  cpu: "Intel(R) Xeon(R) Platinum 8163 CPU @ 2.50GHz"
  cpuNum: 4
  diskInfo:
  logsRoot:
  available: 23125512192
  capacity: 0.62
  filesystem: "/dev/vda1"
  size: 63278198784
  used: 36914737152
  __proto__: Object
  serverRoot:
  available: 23125512192
  capacity: 0.62
  filesystem: "/dev/vda1"
  size: 63278198784
  used: 36914737152
  __proto__: Object
  __proto__: Object
  hostname: "dtboost-cluster011158128115.na62"
  kernel: "3.10.0-327.ali2018.alios7.x86_64"
  memory: 7.6394805908203125
  memoryUsage: 33
  nodeVersion: "12.13.0"
  serverVersion: "2.0.0_1"
  sysLoad: (3) [0.00927734375, 0.0185546875, 0.04541015625]
  sysTime: "2020-09-06T02:22:48.990Z"
  timezone: "UTC+8"
  uname: "Linux"
 */

export default Machine;
