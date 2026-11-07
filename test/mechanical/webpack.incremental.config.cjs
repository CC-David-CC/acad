const path = require('path');
const config = require('./webpack.config.cjs');
config.entry = [path.join(__dirname, 'failed-add-regression.test.mjs'), path.join(__dirname, 'atomic-admission.test.mjs'), path.join(__dirname, 'incremental-connected.test.mjs')];
config.output = {path: '/tmp/codi-jsketcher-incremental-tests', filename: 'incremental.cjs'};
module.exports = config;
