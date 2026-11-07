const path = require('path');
const webpack = require('webpack');
const root = path.resolve(__dirname, '../..');
module.exports = {
  mode: 'development', target: 'node', devtool: false,
  entry: [path.join(__dirname, 'midpoint.test.mjs'), path.join(__dirname, 'midpoint-order.test.mjs'), path.join(__dirname, 'midpoint-conflict-removal.test.mjs'), path.join(__dirname, 'failed-add-regression.test.mjs'), path.join(__dirname, 'atomic-admission.test.mjs'), path.join(__dirname, 'external-stage-reclassification.test.mjs'), path.join(__dirname, 'independent-external-recovery.test.mjs')],
  output: {path: '/tmp/codi-jsketcher-mechanical-tests', filename: 'midpoint.cjs'},
  resolve: {extensions: ['.js', '.jsx', '.ts', '.tsx'], modules: [path.join(root, 'modules'), path.join(root, 'web/app'), 'node_modules']},
  module: {rules: [
    {test: /\.(js|jsx|ts|tsx)$/, loader: 'babel-loader', include: [path.join(root, 'modules'), path.join(root, 'web/app')]},
    {test: /\.svg$/, type: 'asset/source'},
  ]},
  plugins: [new webpack.BannerPlugin({banner: 'global.verb = {eval: {Analyze: {}}};', raw: true, entryOnly: true})],
};
