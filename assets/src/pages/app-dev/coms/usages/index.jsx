import React, {useState, useMemo} from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import {Menu, Dropdown} from 'antd';
import WhiteSpace from '@coms/white-space';
import {DownOutlined} from '@ant-design/icons';

import Ring from '@coms/ring';

export const MODE = {
  MEM: 'mem',
  DISK: 'disk',
};

const Usages = (props) => {
  const {usages, mode} = props;
  const ip = _.get(props, 'usages[0].ip');
  const [selectIp, setSelectIp] = useState(ip);

  let usage = usages.find(u => u.ip === selectIp);
  const isMem = mode === MODE.MEM;

  if (!usage && usages.length) {
    usage = usages[0];
    setSelectIp(usages[0].ip);
  }

  const onIpClick = ({key}) => {
    setSelectIp(key);
  };

  const menu = (
    <Menu
      onClick={onIpClick}
      className="usage-dropdown"
    >
      {
        usages.map(u => {
          return (
            <Menu.Item key={u.ip}>
              {u.ip}
            </Menu.Item>
          );
        })
      }
    </Menu>
  );

  const title = useMemo(() => {
    return (
      <div style={{cursor: 'pointer', whiteSpace: 'nowrap'}}>
        <Dropdown overlay={menu}>
          <span>
            {
              isMem ? `内存情况(${selectIp})` : `磁盘情况(${selectIp})`
            }
            <WhiteSpace />
            <DownOutlined />
          </span>
        </Dropdown>
      </div>
    );
  }, [selectIp]);

  if (!usage) {
    return null;
  }

  if (!props.usages || !Array.isArray(props.usages)) {
    return null;
  }

  return (
    <Ring
      all={Number(isMem ? usage.totalMem : usage.totalDisk)}
      part={Number(isMem ? (usage.totalMem - usage.avaMem).toFixed(2) :
        (usage.totalDisk - usage.avaDisk).toFixed(2))}
      title={title}
      allTitle={isMem ? '总内存(G)' : '磁盘容量(G)'}
      partTitle={isMem ? '已用内存(G)' : '已用磁盘(G)'}
      anotherTitle={isMem ? '剩余内存(G)' : '剩余磁盘(G)'}
    />
  );
};

Usages.propTypes = {
  usages: PropTypes.arrayOf(PropTypes.shape({
    ip: PropTypes.string,
    totalMem: PropTypes.string,
    avaMem: PropTypes.string,
    totalDisk: PropTypes.string,
    avaDisk: PropTypes.string
  })),
  mode: PropTypes.string
};

export default Usages;
