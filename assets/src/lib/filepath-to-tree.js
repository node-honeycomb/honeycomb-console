/**
 * 将后端返回的文件路径转化为数组
 * @param {String[]} files 文件路径
 */
const filepaths2tree = (files = []) => {
  // 归整

  const result = [];


  // 优先处理应用日志
  files
    .filter(filepath => filepath.includes('/'))
    .forEach(filepath => {
      const [directory, filename] = filepath.split('/');

      if (!result.find(item => item.title === directory)) {
        result.push({
          title: directory,
          level: 0,
          parent: null,
        });
      }

      result.push({
        parent: directory,
        title: filename,
        level: 1,
        filepath: filepath,
        key: filepath
      });
    });


  result.push({
    title: '系统',
    level: 0,
    parent: null
  });

  files
    .filter(filepath => !filepath.includes('/'))
    .forEach(filepath => {
      result.push({
        title: filepath,
        level: 1,
        parent: '系统',
        key: filepath
      });
    });

  return result;
};

export default filepaths2tree;
