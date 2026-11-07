const path = require('path');
const config = require('./webpack.headless-sketch-worker.cjs');
config.entry = path.join(__dirname, '../modules/engine/extrusion/prismSemantic.worker.ts');
config.output = {path: path.join(__dirname, '../.build/prism-semantic-worker'), filename:'worker.js', globalObject:'self'};
module.exports = config;
