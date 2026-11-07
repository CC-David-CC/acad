// Keep preview validation inside the host-authenticated static Worker asset.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const source=fs.readFileSync(path.join(__dirname,'../modules/engine/mount/displayProjection.mjs'),'utf8');
const hash=crypto.createHash('sha256').update(source).digest('hex');
function embedDisplayProjection(worker){
 const marker="const {createDisplayProjection}=await import(new URL('./displayProjection.mjs',self.location.href)),display=createDisplayProjection";
 if(worker.split(marker).length!==2||source.split('export function createDisplayProjection').length!==2)throw Error('Unexpected display projection source.');
 return worker.replace(marker,'const display=createDisplayProjection')+'\n'+source.replace('export function createDisplayProjection','function createDisplayProjection');
}
module.exports={embedDisplayProjection,displayProjectionSha256:hash};
