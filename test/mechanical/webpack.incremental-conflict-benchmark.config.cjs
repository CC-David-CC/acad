const path = require('path');
const config = require('./webpack.config.cjs');
config.entry = path.join(__dirname, 'incremental-conflict-benchmark.mjs');
config.output = {path: '/tmp/codi-jsketcher-incremental-conflict-bench', filename: 'bench.cjs'};
module.exports = config;
