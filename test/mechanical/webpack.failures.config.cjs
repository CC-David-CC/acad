const path = require('path');
const config = require('./webpack.config.cjs');
config.entry = path.join(__dirname, 'failed-add-regression.test.mjs');
config.output = {path: '/tmp/codi-jsketcher-mechanical-failures', filename: 'failures.cjs'};
module.exports = config;
