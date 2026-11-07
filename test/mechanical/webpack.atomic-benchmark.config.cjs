const path = require('path');
const config = require('./webpack.config.cjs');
config.entry = path.join(__dirname, 'atomic-admission-benchmark.mjs');
config.output = {path: '/tmp/codi-jsketcher-atomic-admission-bench', filename: 'bench.cjs'};
module.exports = config;
