// Research probe only; not wired into export. Import explicit AOT no-eval build.
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const path=process.env.CODI_MANIFOLD_JS;if(!path)throw Error('CODI_MANIFOLD_JS required');
const mod=await import(pathToFileURL(path));const wasm=await mod.default();wasm.setup();
const cube=(size,position)=>wasm.Manifold.cube(size).translate(position);
function intersection(a,b){const i=a.intersect(b);try{return {status:i.status(),empty:i.isEmpty(),volume:i.volume()};}finally{i.delete();}}
const outer=cube([40,30,2],[0,0,12]),cut=cube([10,5,2],[10,10,13]),lid=outer.subtract(cut),label=cube([10,5,1],[10,10,13]),outside=cube([2,2,2],[60,0,0]),overlap=cube([10,5,1],[10,10,12.9]),thin=cube([10,5,1],[10,10,13-1e-6]);
try {
 for(const m of [outer,cut,lid,label,outside,overlap,thin]) assert.equal(m.status(),'NoError');
 const fit=intersection(lid,label),apart=intersection(lid,outside),bad=intersection(lid,overlap),small=intersection(lid,thin);
 console.log('OBSERVED',JSON.stringify({fit,apart,bad,small}));
 assert.equal(fit.status,'NoError');assert.equal(fit.volume,0);assert.equal(fit.empty,false);
 assert.equal(small.status,'NoError');assert.ok(small.volume>0);
 assert.equal(apart.empty,true);assert.equal(bad.status,'NoError');assert.equal(bad.empty,false);assert.ok(bad.volume>0.1);
 console.log(JSON.stringify({fit,apart,bad,small}));
}finally{for(const m of [outer,cut,lid,label,outside,overlap,thin])m.delete();}
