const {spawnSync} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const inventory = path.join(root,'.build','source-inputs');
const engines = {...process.env, CODI_SOURCE_OCCT:'1', CODI_EMBED_NUMERIC:'1'};

function run(script, ...args) {
  const result = spawnSync(process.execPath, [script, ...args], {cwd:root, env:engines, stdio:'inherit'});
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}

function compile(configName) {
  const webpack = require('webpack');
  const config = require(path.resolve(root,configName));
  const compiler = webpack(config);
  compiler.run((error,stats) => {
    if (error) throw error;
    if (stats.hasErrors()) throw Error(stats.toString({all:false,errors:true}));
    if (stats.hasWarnings()) console.warn(stats.toString({all:false,warnings:true}));
    const resources = new Set();
    function record(module) {
      if (module.resource) resources.add(path.relative(root,module.resource.split('?')[0]));
      for (const child of module.modules || []) record(child);
    }
    for (const module of stats.compilation.modules) record(module);
    fs.mkdirSync(inventory,{recursive:true});
    fs.writeFileSync(path.join(inventory,path.basename(configName)+'.json'),JSON.stringify([...resources].sort()));
    compiler.close(closeError => {
      if (closeError) throw closeError;
      console.log(configName+' compiled successfully');
    });
  });
}

if (process.argv[2]) {
  compile(process.argv[2]);
} else {
  run('build/precompile-numeric.cjs');
  for (const worker of ['physical-parameters','headless-sketch','project-validation','native-archive','prism-semantic']) {
    run(__filename, 'build/webpack.'+worker+'-worker.cjs');
  }
  run(__filename, 'webpack.config.js');
}
