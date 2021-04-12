const getProc = (cluster) => {
  let workerNum = 0;
  let expectWorkerNum = 0;

  cluster.forEach((value) => {
    workerNum += value.workerNum || 0;
    expectWorkerNum += value.expectWorkerNum || 0;
  });

  return [workerNum, expectWorkerNum];
};

export default getProc;
