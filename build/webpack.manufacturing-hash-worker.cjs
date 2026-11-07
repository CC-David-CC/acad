const path = require('path');
module.exports = {
  mode: 'production', target: 'webworker', devtool: false,
  entry: path.join(__dirname, '../web/app/cad/projectManager/incrementalHashWorker.mjs'),
  output: {path:path.join(__dirname, '../.build/manufacturing-hash-worker'), filename:'worker.js', globalObject:'self'},
  optimization: {splitChunks:false, runtimeChunk:false}
};
