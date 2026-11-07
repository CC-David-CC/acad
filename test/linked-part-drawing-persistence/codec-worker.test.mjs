// Real codec + production validation Worker; synthetic metadata, no Native proof.
import test from 'node:test';
import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {definition} from '../linked-part-drawing-definition/fixture.mjs';
import {encodeProjectEnvelope as encode,decodeProjectEnvelope as decode,validateProjectTree} from '../../web/app/cad/projectManager/projectEnvelope.mjs';
import {geometryRevision,manufacturingSnapshotDigest} from '../../web/app/cad/projectManager/manufacturingMetadata.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url)),plain=value=>JSON.parse(JSON.stringify(value));
const project=()=>({model:{history:[],expressions:'',assembly:[],counters:{featureId:0}},sketches:[]});
const native=()=>encode(project(),null,null,definition());
async function validate(value){
 const worker=new Worker(resolve(root,'test/display-units/node-worker.cjs'),{workerData:{entry:resolve(root,'.build/display-units/validation/worker.js'),verb:resolve(root,'web/lib/verb.js')}});
 try{return await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Actual validation Worker deadline')),30000);worker.on('error',error=>{clearTimeout(timer);reject(error);});worker.on('message',reply=>{if(reply.progress)return;clearTimeout(timer);resolve(reply);});worker.postMessage({blob:new Blob([JSON.stringify(value)],{type:'application/json'})});});}
 finally{await worker.terminate();}
}
test('v2 encoding and decoded return shape remain exact, including null fourth argument',()=>{
 const p=project(),expected={format:'codi-jsketcher-project',version:2,unit:'millimeter',project:p};
 assert.deepEqual(encode(p),expected);assert.deepEqual(encode(p,null,null,null),expected);assert.deepEqual(decode(expected),{project:p,manufacturing:null});
});
test('v3 has exactly one detached frozen definition; removal returns ordinary v2',()=>{
 const p=project(),source=definition(),before=plain(source),value=encode(p,null,null,source);
 assert.equal(value.version,3);assert.equal(value.project,p);assert.deepEqual(plain(value.drawings),[before]);assert(Object.isFrozen(value.drawings));assert(Object.isFrozen(value.drawings[0]));
 source.title='later caller mutation';assert.equal(value.drawings[0].title,before.title);
 const decoded=decode(plain(value));assert.deepEqual(plain(decoded.drawing),before);assert(Object.isFrozen(decoded.drawing));assert.notEqual(decoded.drawing,value.drawings[0]);
 assert.deepEqual(plain(encode(decoded.project,decoded.manufacturing,null,decoded.drawing)),plain(value));assert.equal(encode(p,null,null,null).version,2);
});
test('v3 rejects missing/null/empty/multiple/sparse/extra-property arrays and unsupported combinations',()=>{
 const cases=[];for(const drawings of [null,[],[definition(),definition()],[undefined]])cases.push({...native(),drawings});
 const missing=native();delete missing.drawings;cases.push(missing);
 const sparse=new Array(1),extra=[definition()];extra.extra=true;cases.push({...native(),drawings:sparse},{...native(),drawings:extra});
 cases.push({...native(),version:2},{...native(),version:4},{...native(),unit:'inch'},{...native(),unexpected:true});
 for(const value of cases)assert.throws(()=>decode(value));
 assert.throws(()=>encode(project(),null,null,[]));
});
test('v3 field/list/definition accessors are rejected without evaluating them',()=>{
 let reads=0;const getter=()=>{reads++;throw Error('Getter must not run');};
 for(const key of ['version','drawings','project','format','presentation']){const value=native();Object.defineProperty(value,key,{enumerable:true,get:getter});assert.throws(()=>decode(value));}
 const list=[definition()];Object.defineProperty(list,'0',{enumerable:true,get:getter});assert.throws(()=>decode({...native(),drawings:list}));
 const d=definition();Object.defineProperty(d,'title',{enumerable:true,get:getter});assert.throws(()=>encode(project(),null,null,d));assert.equal(reads,0);
});
test('v3 rejects symbol/hidden/foreign prototypes while admitted null data prototypes work',()=>{
 for(const mode of ['symbol','hidden','prototype','array-symbol','array-prototype']){const value=native();if(mode==='symbol')value[Symbol('extra')]=1;if(mode==='hidden')Object.defineProperty(value,'hidden',{value:true});if(mode==='prototype')Object.setPrototypeOf(value,{extra:true});if(mode==='array-symbol'){value.drawings=[definition()];value.drawings[Symbol('extra')]=true;}if(mode==='array-prototype'){value.drawings=[definition()];Object.setPrototypeOf(value.drawings,{});}assert.throws(()=>decode(value));}
 const value=plain(native());Object.setPrototypeOf(value,null);Object.setPrototypeOf(value.drawings,null);assert.equal(decode(value).drawing.drawingId,'fixture-drawing');
});
test('definition schema/physical domains and existing 64KiB cap are enforced in codec',()=>{
 for(const mutate of [d=>d.unit='inch',d=>d.sheet.width=0,d=>d.sheet.height=Infinity,d=>d.sheet.scale.numerator=0,d=>d.views[0].paperOrigin[0]=-1,d=>d.dimensions[0].value=10]){const d=definition();mutate(d);assert.throws(()=>encode(project(),null,null,d));assert.throws(()=>decode({...native(),drawings:[d]}));}
 const d=definition();d.dimensions=Array.from({length:16},(_,i)=>({dimensionId:'dimension-'+i,viewId:'top-view',label:[10,10],kind:'edge-length',edge:{kind:'native-edge',originFeatureId:1,selectionId:'s'.repeat(8000)+i,geometry:'line'}}));assert.throws(()=>encode(project(),null,null,d),{code:'RESOURCE_LIMIT'});
});
test('drawing is outside project geometry/manufacturing digest domains and coexists with inch presentation',async()=>{
 const p=project(),metadata={version:1,unit:'millimeter',revision:await geometryRevision(p),materials:[],appearances:[],bindings:[],objects:[]},inch={version:1,lengthUnit:'inch'},a=encode(p,metadata,inch),b=encode(p,metadata,inch,definition());
 assert.deepEqual(a.project,b.project);assert.deepEqual(a.manufacturing,b.manufacturing);assert.deepEqual(a.presentation,b.presentation);assert.equal(await geometryRevision(a.project),await geometryRevision(b.project));assert.equal(await manufacturingSnapshotDigest(a.project,a.manufacturing),await manufacturingSnapshotDigest(b.project,b.manufacturing));assert.deepEqual(decode(b).presentation,inch);
});
test('global tree depth/node/nonfinite limits remain active',()=>{
 let tree=0;for(let i=0;i<130;i++)tree={next:tree};assert.throws(()=>validateProjectTree(tree),/validation limits/);assert.throws(()=>validateProjectTree(new Array(1000001).fill(0)),/validation limits/);assert.throws(()=>validateProjectTree({x:NaN}),/non-finite/);
});
test('actual validation Worker retains complete v3 data and model/sketch-only storage projection',async()=>{
 const value=plain(native());value.presentation={version:1,lengthUnit:'inch'};
 const reply=await validate(value);assert.equal(reply.ok,true);assert.deepEqual(reply.value,value);assert.equal(reply.value.drawings[0].unit,'millimeter');assert.deepEqual(JSON.parse(reply.storage.model),value.project.model);assert.deepEqual(reply.storage.sketches,[]);assert.equal(Object.hasOwn(reply.storage,'drawings'),false);
});
test('actual Worker retains structurally valid unresolved source/target/build intent',async()=>{
 const value=plain(native());value.drawings[0].target.featureId=999;value.drawings[0].target.engineRevision='sha256:'+'c'.repeat(64)+':'+'d'.repeat(64);value.drawings[0].datum.regionId='missing opaque region';for(const d of value.drawings[0].dimensions){for(const key of ['from','to'])if(d[key])d[key].regionId='missing opaque region';if(d.hole)d.hole.regionId='missing opaque region';}
 const reply=await validate(value);assert.equal(reply.ok,true);assert.deepEqual(reply.value,value);assert.equal(reply.value.project.model.history.length,0);
});
test('actual Worker rejects malformed v3 and does not return staged storage',async()=>{
 for(const mutate of [v=>v.drawings=null,v=>v.drawings.push(definition()),v=>v.drawings[0].unit='inch',v=>v.version=2,v=>v.drawings[0].target.handle='forbidden']){const value=plain(native());mutate(value);const reply=await validate(value);assert.equal(reply.ok,false);assert.equal(reply.value,undefined);assert.equal(reply.storage,undefined);}
});
