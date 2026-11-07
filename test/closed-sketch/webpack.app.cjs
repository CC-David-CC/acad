// Private qualification fixture, including the matching test-only helper.
// Never use the helper entry as a public deployment asset.
process.env.CODI_EMBED_NUMERIC='1';process.env.CODI_EMBED_MANIFOLD='1';
const path=require('path'),config=require('../../webpack.config');
config.resolve.symlinks=false;config.devtool=false;
config.entry.webosTest='./test/webos/helper-entry.js';
config.module.rules[0].include.push(path.resolve(__dirname,'..'));
module.exports=config;
