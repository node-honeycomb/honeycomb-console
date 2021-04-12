import {notification} from 'antd';

// TODO: 限流 notification

const notificationError = (...rest) => {
  return notification.error(...rest);
};

export default {
  error: notificationError
};

