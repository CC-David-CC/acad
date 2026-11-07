// Isolated evidence build: never overwrite another worktree's dependency cache.
const path=require('path'),config=require('../../build/webpack.project-validation-worker.cjs');
config.output.path=path.resolve(__dirname,'../../.build/line-relation-project-worker');
config.resolve.symlinks=false;
module.exports=config;
