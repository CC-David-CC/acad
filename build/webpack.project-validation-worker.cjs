const path = require('path');
const fs = require('fs');
const config = require('../webpack.config');
// Project validation imports the same numerical solver as the sketch worker.
// It must not depend on an optional app-build environment flag for CSP safety.
const numeric = path.join(__dirname, '../node_modules/.cache/codi-numeric/precompiled.js');
if (!fs.existsSync(numeric)) throw new Error('Build the CSP-safe numeric module before the project validation worker.');
config.resolve.alias.numeric = numeric;
config.target = 'webworker';
config.entry = path.join(__dirname, '../web/app/cad/projectManager/projectValidationWorker.ts');
config.output = {path: path.join(__dirname, '../node_modules/.cache/codi-project-worker'), filename: 'worker.js', globalObject: 'self'};
config.optimization = {splitChunks: false, runtimeChunk: false};
// Validation imports existing shape/constraint code, which also references UI
// components. CSS must stay inert in a worker; geometry uses none of it.
config.module.rules = [config.module.rules.find(rule => rule.loader === 'babel-loader'), {test: /\.(css|less)$/, type: 'asset/source'}, ...config.module.rules.slice(-3)];
module.exports = config;
