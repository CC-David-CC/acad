// Normal application entries, own output and project Worker. Optional loft must
// stay unavailable without the explicit provider flag, even with a staged cache.
const path=require('node:path');
if(process.env.CODI_LOFT_NATIVE_DIR?.trim())throw Error('This retained-build check requires loft disabled');
const config=require('../combined-axis/webpack.app.cjs');
config.output={...config.output,path:path.resolve(__dirname,'../../.build/public-worker-loft/normal-app')};
module.exports=config;
