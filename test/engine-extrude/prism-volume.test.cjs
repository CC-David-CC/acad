// Exercise the exact math embedded in the classic production worker.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('modules/engine/mount/oci-verified-worker.js','utf8');
const context=vm.createContext({self:{},URL,Map,Number,Array,Math,Error});
vm.runInContext(source+'\nglobalThis.measure=expectedPrismVolume;',context);
const measure=context.measure;
test('translated authored polygon area distinguishes edge-product volume',()=>{
 const points=[[0,0,0],[0.1,0,0],[0.1,0.1,0],[1e-7,0.1,0]],v=measure(points,[0,0,1],10000);
 assert.ok(Math.abs(v-99.99995)<1e-10);assert.ok(Math.abs(v-100)>1e-5);
 const shifted=points.map(([x,y,z])=>[x+9000000,y+1000000,z+7]);assert.ok(Math.abs(measure(shifted,[0,0,1],10000)-v)<0.0001);
});
test('rejects degenerate, invalid and backwards orientation',()=>{
 assert.throws(()=>measure([[0,0,0],[1,0,0],[2,0,0],[3,0,0]],[0,0,1],1));
 assert.throws(()=>measure([[0,0,0],[1,0,0],[1,1,0],[0,1,0]],[0,0,-1],1));
 assert.throws(()=>measure([[0,0,0],[1,0,0],[1,1,0],[0,Infinity,0]],[0,0,1],1));
});
