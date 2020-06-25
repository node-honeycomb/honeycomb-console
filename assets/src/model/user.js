import {userApi} from '@api';

export default {
  namespace: 'user',
  state: {
    users: [],
  },
  effects: {
    // 获取当前用户的列表
    * getUsers(payload, {put}) {
      try {
        const users = yield userApi.list();

        yield put({
          type: 'saveUsers',
          payload: {
            users,
          },
        });
      } catch (error) {
        console.log(error);
        throw error;
      }
    },
  },
  reducers: {
    saveUsers: (state, {payload}) => {
      const users = payload.users;

      state.users = users;

      return state;
    },
  },
};
