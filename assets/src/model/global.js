import _ from 'lodash';
import {message} from 'antd';

import api from '@api/index';
import {clusterApi} from '@api';
import {tryParse} from '@lib/util';
import {LS_LAST_SELECT_CLUSTER_CODE} from '@lib/consts';


const key = 'cluster-usage-count';

const addClusterCount = (clusterCode) => {
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, JSON.stringify({}));
  }

  let v = tryParse(localStorage.getItem(key), {});

  if (!_.isObject(v)) {
    v = {};
  }

  if (!v[clusterCode]) {
    v[clusterCode] = 0;
  }

  v[clusterCode]++;

  localStorage.setItem(key, JSON.stringify(v));
};

const getFreqClusterCodes = () => {
  const v = tryParse(localStorage.getItem(key), {});

  let codes = Object.keys(v).map(key => [key, v[key]]);

  codes = codes.sort((a, b) => {
    return a[1] - b[1];
  });

  return codes.map(v => v[0]);
};

export default {
  namespace: 'global',
  state: {
    clusters: {},              // 集群列表
    currentClusterCode: null,  // 当前集群code
    currentCluster: {},        // 当前集群的信息
    freqClusters: [],          // 经常使用的集群
    checkingClusterCode: null, // 正在检查的云计算资源code
    checkedClusters: [],       // 集群状态
  },
  effects: {
    // 获取当前用户的可用的集群
    // 彬设置默认选中的 cluster
    * getCluster(__, {put}) {
      const clusters = yield clusterApi.list();

      yield put({
        type: 'saveCluster',
        payload: {
          clusters,
        },
      });

      return clusters;
    },
    * checkClusters(payload, {put, select}) {
      const {checkedClusters, clusters, checkingClusterCode} = yield select(state => state.global);

      if (checkingClusterCode) {
        return message.loading('正在校验中...');
      }

      const clusterCodes = Object.keys(clusters);

      // eslint-disable-next-line
      for (const clusterCode of clusterCodes) {
        try {
          const result = yield api.clusterApi.status(clusterCode);

          // FIXME: 考虑部分机器丢失的问题
          checkedClusters.push([clusterCode, true, result]);
        } catch (err) {
          checkedClusters.push([clusterCode, false, err.message]);
        }

        yield put({
          type: 'setCheckingClusterCode',
          payload: {
            clusterCode
          }
        });

        yield put({
          type: 'setCheckedClusters',
          payload: {
            checkedClusters
          }
        });
      }

      yield put({
        type: 'setCheckingClusterCode',
        payload: {
          clusterCode: null
        }
      });
    }
  },
  reducers: {
    saveCluster: (state, {payload}) => {
      const clusters = payload.clusters;

      state.clusters = clusters;

      return state;
    },
    /**
     * 设置全局的clusterCode
     * @param {Object} payload
     * @param {String} payload.clusterCode
     */
    setCluster: (state, {payload}) => {
      const {clusterCode} = payload;
      const {clusters} = state;

      // 没有集群列表时不设置集群
      if (!clusters || Object.keys(clusters) === 0) {
        return state;
      }

      // 当前集群不在集群列表时不设置集群
      if (!clusters[clusterCode]) {
        return state;
      }

      addClusterCount(clusterCode);

      const freqClusterCodes = getFreqClusterCodes();
      const freqClusters = [];

      localStorage.setItem(LS_LAST_SELECT_CLUSTER_CODE, clusterCode);

      for (let i = 0; i < freqClusterCodes.length; i++) {
        const code = freqClusterCodes[i];
        const cluster = clusters[code];

        if (clusters[code]) {
          cluster.code = code;
          freqClusters.push(cluster);
        }

        if (freqClusters.length >= 3) {
          break;
        }
      }

      state.freqClusters = freqClusters;
      state.currentCluster = clusters[clusterCode];
      state.currentCluster.code = clusterCode;
      state.currentClusterCode = clusterCode;

      // 浅拷贝
      return {...state};
    },
    setCheckingClusterCode: (state, {payload}) => {
      const {clusterCode} = payload;

      state.checkingClusterCode = clusterCode;

      return {...state};
    },
    setCheckedClusters: (state, {payload}) => {
      const {checkedClusters} = payload;

      state.checkedClusters = checkedClusters;

      return {...state};
    },
  }
};
