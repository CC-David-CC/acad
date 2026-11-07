// Same product graph, private qualified dependency symlinks, no source maps.
process.env.CODI_EMBED_NUMERIC='1';process.env.CODI_EMBED_MANIFOLD='1';
const config=require('../../webpack.config');
config.resolve.symlinks=false;
config.devtool=false;
config.entry={index:config.entry.index};
module.exports=config;
