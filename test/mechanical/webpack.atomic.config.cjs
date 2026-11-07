const path = require('path');
const config = require('./webpack.config.cjs');
config.entry = [path.join(__dirname, 'failed-add-regression.test.mjs'), path.join(__dirname, 'atomic-admission.test.mjs')];
config.output = {path: '/tmp/codi-jsketcher-atomic-admission-tests', filename: 'atomic.cjs'};
module.exports = config;
