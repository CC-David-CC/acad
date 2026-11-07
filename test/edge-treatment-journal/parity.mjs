// Independent live-helper admission parity; no native/model operation runs.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {captureSolidEdgeTreatmentParameters as journal} from '../../web/app/cad/craft/authoredEditJournal.mjs';
const file=resolve(process.env.CODI_SOLID_INTENT_MODULE||'modules/engine/solid/solidIntent.mjs'),hash=()=>createHash('sha256').update(readFileSync(file)).digest('hex'),before=hash();
const {captureSolidEdgeTreatment:operation,solidBodyId}=await import(pathToFileURL(file));assert.equal(typeof operation,'function','Use the real current core helper, not a test replacement.');
const base=()=>({version:1,unit:'millimeter',engine:'occ',engineRevision:'sha256:'+'a'.repeat(64)+':'+'b'.repeat(64),featureId:17,target:solidBodyId(10),producerFeatureId:10,kind:'fillet',edgeIds:['opaque-edge-a','opaque-edge-b'],size:3});
const cases=[{name:'fillet',make:base},{name:'chamfer',make:()=>({...base(),kind:'chamfer-equal'})},{name:'reordered-valid-IDs',make:()=>({...base(),edgeIds:['opaque-edge-b','opaque-edge-a']})}];
for(const [key,values]of Object.entries({version:[true,2],unit:['inch'],engine:['manifold','smlib'],engineRevision:['unknown'],featureId:[0,10],producerFeatureId:[0,'10'],target:[7,'edge:1',{}],kind:['chamfer','polish'],size:[0,-1,NaN,Infinity,'3',1e6+1],edgeIds:[[],['a','a'],[1],Array(1),Array.from({length:17},(_,i)=>String(i)),['x'.repeat(16385)]]}))for(const [i,value]of values.entries())cases.push({name:key+'-'+i,make:()=>({...base(),[key]:value})});
for(const key of['handle','nativeIndex','resultLocal','geometry','mesh','profile','ptr','propagation'])cases.push({name:'extra-'+key,make:()=>({...base(),[key]:{}})});
for(const key of Object.keys(base()))cases.push({name:'accessor-'+key,make:()=>{const p=base();Object.defineProperty(p,key,{enumerable:true,get(){throw Error('Getter must not run');}});return p;}});
const rows=[];for(const c of cases){const run=fn=>{try{return{accepted:true,value:fn(c.make())};}catch{return{accepted:false};}},a=run(journal),b=run(operation);assert.deepEqual(a,b,c.name);rows.push({name:c.name,accepted:a.accepted});}
assert.equal(hash(),before);const result={status:'PASS',scope:'Data-only admission parity with the actual supplied core capture helper; no engine/build/selection feasibility claim',coreSourceSHA256:before,journalSourceSHA256:createHash('sha256').update(readFileSync(new URL('../../web/app/cad/craft/authoredEditJournal.mjs',import.meta.url))).digest('hex'),cases:rows.length,accepted:rows.filter(x=>x.accepted).length,refused:rows.filter(x=>!x.accepted).length,rows};
if(process.argv[2])writeFileSync(process.argv[2],JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
