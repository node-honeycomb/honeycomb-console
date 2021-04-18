const key = 'hc-pin-cluster';

const save = (cfg) => {
  localStorage.setItem(key, JSON.stringify(cfg));
};

export const toggle = (clusterCode) => {
  let clusterCodes = list();


  if (clusterCodes.includes(clusterCode)) {
    clusterCodes = clusterCodes.filter(c => c !== clusterCode);
  } else {
    clusterCodes.push(clusterCode);
  }

  save(clusterCodes);
};

export const list = () => {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (e) {
    return [];
  }
};
