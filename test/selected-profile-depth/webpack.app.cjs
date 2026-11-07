// Normal public application entries; no qualification helper is emitted.
process.env.CODI_EMBED_NUMERIC='1';process.env.CODI_EMBED_MANIFOLD='1';
const config=require('../../webpack.config');
config.resolve.symlinks=false;config.devtool=false;
module.exports=config;
