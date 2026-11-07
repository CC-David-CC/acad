// Qualification build with the normal application entries only. Keep the
// matching project Worker in this worktree instead of the shared dependency
// cache; never publish the private webosTest helper with a signed app.
process.env.CODI_EMBED_NUMERIC = '1';
process.env.CODI_EMBED_MANIFOLD = '1';
const path = require('path');
const config = require('../../webpack.config');
const projectWorker = path.resolve(__dirname, '../../.build/line-relation-project-worker');
config.resolve.symlinks = false;
config.devtool = false;
config.resolve.alias['codi-project-validation-worker$'] = path.join(projectWorker, 'worker.js');
config.module.rules.push({
  test: /worker\.js$/,
  include: [projectWorker],
  type: 'asset/resource',
  generator: {filename: 'project-validator.[contenthash][ext]'}
});
module.exports = config;
