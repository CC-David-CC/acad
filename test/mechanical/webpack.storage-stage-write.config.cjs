const path = require('path');
const config = require('./webpack.config.cjs');
config.entry = path.join(__dirname, 'storage-stage-write.test.mjs');
config.output = {path: '/tmp/codi-storage-stage-write-tests', filename: 'tests.cjs'};
module.exports = config;
