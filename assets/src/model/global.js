import {clusterApi} from '@api';

export default {
  namespace: 'global',
  state: {
    clusters: {},              // 集群列表
    currentClusterCode: null   // 当前集群code
  },
  effects: {
    // 获取当前用户的可用的集群
    * getCluster(payload, {put}) {
      const clusters = yield clusterApi.list();

      yield put({
        type: 'saveCluster',
        payload: {
          clusters
        }
      });
    },
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

      state.currentClusterCode = clusterCode;

      return state;
    }
  }
};
