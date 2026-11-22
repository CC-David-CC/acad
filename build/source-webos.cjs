const {spawnSync} = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const env = {...process.env, CODI_SOURCE_OCCT:'1', CODI_EMBED_NUMERIC:'1'};
const node = process.execPath;
const webpack = require.resolve('webpack/bin/webpack.js');

function run(script, ...args) {
  const result = spawnSync(node, [script, ...args], {cwd:root, env, stdio:'inherit'});
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}

run('build/precompile-numeric.cjs');
for (const worker of ['physical-parameters','headless-sketch','project-validation','native-archive','prism-semantic']) {
  run(webpack, '--config', 'build/webpack.'+worker+'-worker.cjs', '--stats', 'errors-warnings');
}
run(webpack, '--config', 'webpack.config.js', '--stats', 'errors-warnings');
