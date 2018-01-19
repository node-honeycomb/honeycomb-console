'use strict';

module.exports = (ns, name, status) => {

  if (typeof ns === 'object' && ns.length === 2) {
    status = name;
    name = ns[1];
    ns = ns[0];
  }

  if (!status) {
    return '@@' + ns + '/' + name;
  } else {
    return '@@' + ns + '/' + name + '/' + status;
  }
}
