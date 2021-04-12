import React, {useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import {DatePicker, Select, Button, Switch} from 'antd';

import apis from '@api/index';

const Option = Select.Option;

const Filter = (props) => {
  const {
    filter,
    setFilter,
    machines,
    onQuery,
    loading,
    app,
    currentClusterCode
  } = props;

  const [apps, setApps] = useState([]);

  const onSetFilter = (key) => {
    return (value) => {
      filter[key] = value;
      setFilter({...filter});
    };
  };

  const getApps = async () => {
    const {success} = await apis.appApi.appList(currentClusterCode);

    if (!success || success.length === 0) {
      return;
    }

    const apps = [];

    success.forEach((oneApp) => {
      oneApp.versions.forEach(version => {
        if (!version.isCurrWorking) {
          return;
        }

        apps.push(version.appId);
      });
    });

    setApps(apps);
  };

  useEffect(() => {
    if (!app || !currentClusterCode) {
      return;
    }

    getApps();
  }, []);

  return (

    <div className="filter-content">
      <div className="filter">
      查询时间：
        <DatePicker
          showTime={{format: 'HH'}}
          value={filter.time}
          onChange={onSetFilter('time')}
          format="YYYY-MM-DD HH"
        />
      &nbsp;&nbsp;
        <Select
          value={filter.rangeType}
          onChange={onSetFilter('rangeType')}
          style={{width: 100}}
        >
          {
            [1, 2, 3].map(r => {
              return (
                <Option key={r} value={r}>
                  {r}小时
                </Option>
              );
            })
          }
        </Select>
      </div>
      <div className="filter">
      选择机器：
        <Select
          style={{width: 200}}
          mode="multiple"
          value={filter.machine}
          onChange={onSetFilter('machine')}
          disabled
        >
          {
            machines.map(m => {
              return (
                <Option key={m.ip} value={m.ip}>
                  {m.ip}
                </Option>
              );
            })
          }
        </Select>
      </div>
      {
        app && (
          <div className="filter">
          选择应用：
            <Select
              style={{width: 200}}
              mode="multiple"
              value={filter.apps}
              onChange={onSetFilter('apps')}
            >
              {
                apps.map(appId => {
                  return (
                    <Option key={appId} value={appId}>
                      {appId}
                    </Option>
                  );
                })
              }
            </Select>
          </div>
        )
      }
      <div className="filter">
      持续刷新：
        <Switch
          disabled
          checked={filter.continuous}
          size="small"
          onChange={(e) => {
            return onSetFilter('continuous')(e.target.value);
          }}
        />
      </div>
      <div className="button">
        <Button
          type="primary"
          loading={loading}
          onClick={() => {
            return onQuery(filter);
          }}
        >
        查询
        </Button>
      </div>
    </div>
  );
};

Filter.propTypes = {
  filter: PropTypes.object,
  setFilter: PropTypes.func,
  machines: PropTypes.array,
  onQuery: PropTypes.func,
  loading: PropTypes.bool,
  currentClusterCode: PropTypes.string,
  app: PropTypes.string,
};

export default Filter;
