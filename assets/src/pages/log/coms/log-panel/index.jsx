import React, {useEffect, useState, useCallback} from 'react';
import _ from 'lodash';
import Q from 'queue';
import moment from 'moment';
import PropTypes from 'prop-types';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import {
  CopyOutlined, CloudDownloadOutlined, InfoCircleOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import {
  DatePicker, Select, InputNumber,
  Input, Tooltip, TimePicker, Button, Spin,
  Empty, Switch, message
} from 'antd';
import api from '@api/index';
import msgParser from '@lib/msg-parser';
import {downloadText} from 'download.js';
import WhiteSpace from '@coms/white-space';
import useInterval from '@lib/use-interval';
import notification from '@coms/notification';

const DEFAULT_MAX_LINE = 200;

const defaultFilter = {
  line: DEFAULT_MAX_LINE,
  day: moment().format('YYYY-MM-DD'),
  time: null,
  keyword: null,
  ips: []
};

const timeFormat = 'HH:mm:ss';
const dayFormat = 'YYYY-MM-DD';

/**
 * 模板文件解析到实际日期
 * @param {String} templateFileName 模板文件名 sys.{year}-{month}-{day}.log
 * @param {Moment} time 时间
 */
const getLogFileName = (templateFileName, time) => {
  let filename = templateFileName;
  const now = moment(time).format('YYYY-MM-DD').split('-');

  ['year', 'month', 'day'].forEach((key, ind) => {
    filename = filename.replace(`{${key}}`, now[ind]);
  });

  return filename;
};

const getLogLevel = (log) => {
  const m = log.match(/^\d+-\d+:\d+:\d+\.\d+ (\w+)/);

  return m;
};

const LogPanel = (props) => {
  const {logFileName, clusterCode, currentCluster} = props;

  const [filter, setFilter] = useState(defaultFilter);
  const [logs, setLog] = useState({success: [], error: []});
  const [loading, setLoading] = useState(false);
  const [streamMode, setStreamMode] = useState(false);
  const [pollingStatisc, setPollingStatisc] = useState({success: 0, failed: 0});

  const day = moment(filter.day, dayFormat);
  const time = filter.time ? moment(filter.time, timeFormat) : null;

  const filename = getLogFileName(logFileName, day);

  const q = new Q({
    autostart: true,
    concurrency: 1
  });

  useInterval(() => {
    const polling = () => {
      q.push(async () => {
        await getLogDetail({
          ...filter,
          time: '',
        }, TextTrackCue);
      });
    };

    polling();
  }, streamMode ? 1000 : null);

  // 获取日志详情
  const getLogDetail = useCallback(async (filter, streamMode) => {
    try {
      const {day, time, ips, line, keyword} = filter;

      if (!streamMode) {
        setLoading(true);
      }

      const result = await api.logApi.getLogDetail({
        fileName: getLogFileName(logFileName, moment(day, dayFormat)),
        clusterCode,
        startTime: time,
        ips,
        logLines: line,
        filterString: keyword
      });

      pollingStatisc.success++;
      setLog(result);

      if (streamMode) {
        setPollingStatisc(pollingStatisc);
      }
    } catch (e) {
      if (!streamMode) {
        notification.error({
          message: '获取日志失败',
          description: msgParser(e.message)
        });

        return;
      }
      pollingStatisc.failed++;
      setPollingStatisc(pollingStatisc);
    } finally {
      setLoading(false);
    }
  }, [clusterCode, logFileName, pollingStatisc]);

  useEffect(() => {
    setFilter(defaultFilter);
    getLogDetail(defaultFilter);
    setStreamMode(false);
    setPollingStatisc({success: 0, failed: 0});
  }, [logFileName, clusterCode]);

  /**
   * 设置filter的值
   * @param {String} key 属性名
   * @param {Boolean} autoSearch 是否自动搜索
   */
  const setFilterKey = (key) => {
    return (v) => {
      if (key === 'day') {
        v = v ? v.format(dayFormat) : v;
      }

      if (key === 'time') {
        v = v ? v.format(timeFormat) : v;
      }

      if (typeof v === 'object' && !Array.isArray(v)) {
        v = v.target.value;
      }

      filter[key] = v;
      setFilter(_.clone(filter));
    };
  };

  const onCallSearch = () => {
    getLogDetail(filter);
  };

  const onSetStreamMode = useCallback((value) => {
    setStreamMode(value);
    if (!value) {
      try {
        setPollingStatisc({success: 0, failed: 0});
        q.end();
      } catch (e) {
        console.log(e);
      }
    }
  }, [q]);

  const getLogString = () => {
    if (!logs) {
      return '';
    }

    return logs.success.join('\n');
  };

  const onDownload = () => {
    downloadText(`${filename}.log`, getLogString());
  };

  return (
    <div>
      <div className="log-filter">
        <div className="log-info">
          <span className="log-filename">日志文件: {filename}</span>
          <WhiteSpace />
          <WhiteSpace />
          <span>
            持续刷新<WhiteSpace />
            <Tooltip
              title={`持续刷新时将持续读取日志最后的${filter.line}行信息`}
            >
              <InfoCircleOutlined />：
            </Tooltip>
          </span>
          <Switch
            size="small"
            checked={streamMode}
            onChange={onSetStreamMode}
          />
        </div>
        <div className="log-filter-box">
          <DatePicker
            placeholder="开始日期"
            value={day}
            onChange={setFilterKey('day')}
            disabled={streamMode}
          />
          <TimePicker
            placeholder="开始时间"
            value={time}
            format={timeFormat}
            onChange={setFilterKey('time')}
            disabled={streamMode}
          />
          <Select
            style={{width: 200}}
            mode="multiple"
            placeholder="机器选择"
            onChange={setFilterKey('ips')}
            value={filter.ips}
            disabled={streamMode}
          >
            {
              _.get(currentCluster, 'ips', []).map(ip => {
                return (
                  <Select.Option key={ip} value={ip}>
                    {ip}
                  </Select.Option>
                );
              })
            }
          </Select>
          <InputNumber
            placeholder="最大行数"
            value={filter.line}
            onChange={setFilterKey('line')}
            onPressEnter={onCallSearch}
            disabled={streamMode}
          />
          <Input.Search
            style={{width: 200}}
            placeholder="关键词"
            onChange={setFilterKey('keyword')}
            onPressEnter={onCallSearch}
            disabled={streamMode}
          />
          <Button
            type="primary"
            onClick={onCallSearch}
            loading={loading}
            disabled={streamMode}
          >
            搜索
          </Button>
        </div>
      </div>
      <div className="log-box-op">
        <div className="left">
          <Tooltip title="复制">
            <CopyToClipboard
              text={getLogString()}
              onCopy={() => message.success(`复制成功！共${getLogString().length}个字符`)}
            >
              <CopyOutlined />
            </CopyToClipboard>
          </Tooltip>
          <Tooltip title="下载">
            <CloudDownloadOutlined onClick={onDownload} />
          </Tooltip>
        </div>
        <div className="right">
          {
            streamMode && (
              <div>
                <LoadingOutlined />
                持续刷新中...已请求{pollingStatisc.success + pollingStatisc.failed}次
                ，成功{pollingStatisc.success}次，失败{pollingStatisc.failed}次
              </div>
            )
          }
        </div>
      </div>
      <div className="log-box">
        <Spin spinning={loading}>
          <code>
            {
              !logs.success.length && <Empty description="无日志数据" />
            }
            {
              logs.success.map((log, ind) => {
                const level = getLogLevel(log);

                return (
                  <pre className={`log-code log-${_.lowerCase(level)}`} key={ind}>
                    {log}
                  </pre>
                );
              })
            }
          </code>
        </Spin>
      </div>
    </div>
  );
};

LogPanel.propTypes = {
  logFileName: PropTypes.string,
  clusterCode: PropTypes.string,
  currentCluster: PropTypes.object    // 当前集群
};

export default LogPanel;

