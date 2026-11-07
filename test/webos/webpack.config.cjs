// Build only the browser-test helper after the normal application build.
// Match the CSP-safe normal desktop runtime; numeric's unprepared package
// evaluates generated JavaScript and cannot run under the signed host policy.
process.env.CODI_EMBED_NUMERIC = '1';
process.env.CODI_EMBED_MANIFOLD = '1';
const path = require('path');
const config = require('../../webpack.config');
config.entry = {webosTest: './test/webos/helper-entry.js'};
config.module.rules[0].include.push(path.resolve(__dirname, '..'));
config.devtool = false;
module.exports = config;
