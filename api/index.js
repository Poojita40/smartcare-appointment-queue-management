const path = require('path');

// Vercel Serverless Function entrypoint
// We require the bundled server from dist/
module.exports = (req, res) => {
  const app = require('../dist/server.cjs').default || require('../dist/server.cjs');
  return app(req, res);
};
