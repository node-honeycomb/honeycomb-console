const {createProxyMiddleware} = require('http-proxy-middleware');

module.exports = (router, app) => {
  router.use(
    '/assets',
    createProxyMiddleware({target: 'http://127.0.0.1:8000/', changeOrigin: true})
  );

  app.express.use(
    '/sockjs-node',
    createProxyMiddleware({target: 'ws://127.0.0.1:8000/', changeOrigin: true, ws: true})
  );
};
