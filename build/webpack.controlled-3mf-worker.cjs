const path = require('path');
const webpack = require('webpack');
const root = path.resolve(__dirname, '..');

module.exports = {
  mode: 'production',
  target: 'webworker',
  devtool: false,
  entry: path.join(root, 'web/app/cad/export/controlledMesh3mf.worker.mjs'),
  output: {
    path: path.join(root, '.build/controlled-3mf-worker'),
    filename: 'worker.js',
    globalObject: 'self'
  },
  resolve: {
    extensions: ['.js', '.mjs'],
    modules: [path.join(root, 'modules'), path.join(root, 'web/app'), 'node_modules'],
    // JSZip's browser distribution embeds a string-callback Function shim.
    // Bundle its source instead, using native Promise/Uint8Array in this Worker.
    aliasFields: [],
    mainFields: ['module', 'main'],
    alias: {
      'jszip$': path.join(path.dirname(require.resolve('jszip/package.json')), 'lib/index.js'),
      'setimmediate$': false,
      'lie$': false,
      'readable-stream$': false
    }
  },
  plugins: [
    // JSZip delay() needs callback scheduling, never string execution or a
    // global side-effect polyfill. Node stream APIs are not encoder inputs.
    new webpack.ProvidePlugin({setImmediate: [path.join(root, 'modules/platform/browserTimers.js'), 'setImmediate']}),
    new webpack.optimize.LimitChunkCountPlugin({maxChunks: 1})
  ],
  optimization: {splitChunks: false, runtimeChunk: false}
};
