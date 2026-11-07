import assert from 'node:assert/strict';
import {cellOracle} from './cells.mjs';import {cases,SEED} from './cases.mjs';
const rows=cases(),get=id=>cellOracle(rows.find(r=>r.id===id).expr);
for(const [id,v,m,e]of [['hollow-exact',1000,1,0],['hollow-partial',892,1,1],['hollow-island',792,2,1],['hollow-disjoint',1784,2,1],['composite-fill',2000,2,0],['composite-minus-disjoint',784,1,1],['contact-edge-union',2000,2,0],['contact-face-union',2000,1,0]]){const r=get(id);assert.equal(r.volume,v,id);assert.equal(r.materialRegions,m,id);assert.equal(r.voidRegions,e,id);}
for(const id of ['identical-subtract','disjoint-common']){const r=get(id);assert.equal(r.volume,0);assert.equal(r.boundaryOnlyNonempty,false);}
for(const part of ['face','edge','vertex']){const r=get('contact-'+part+'-common');assert.equal(r.volume,0);assert.equal(r.boundaryOnlyNonempty,true);}
for(const name of ['partial','fill','island'])for(const prefix of ['translated','permuted']){const a=get(prefix+'-'+name),b=get(name==='fill'?'composite-fill':'hollow-'+name);for(const key of ['volume','materialRegions','voidRegions'])assert.equal(a[key],b[key]);}
assert.equal(rows.length,48);assert.ok(rows.every(r=>cellOracle(r.expr).cellCount<=4096));console.log('PASS fixed seed',SEED,'48 exact-cell fixtures, independent known-volume/connectivity controls and transform invariance');
