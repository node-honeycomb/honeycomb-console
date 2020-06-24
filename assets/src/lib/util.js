export const tryParse = (str, defaultValue = {}) => {
  try {
    return JSON.parse(str);
  } catch (e) {
    return defaultValue;
  }
};
