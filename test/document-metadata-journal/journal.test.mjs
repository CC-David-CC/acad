import test from 'node:test';
import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import {emptyAuthoredEditJournal,recordDocumentMetadataEdit as edit,captureDocumentMetadataRecord as capture,documentMetadataTarget as target,planDocumentMetadataTravel as travel,recordExtrusionEdit,planExtrusionTravel} from '../../web/app/cad/craft/authoredEditJournal.mjs';
import {manufacturing,drawing} from './fixture.mjs';
const clone=v=>JSON.parse(JSON.stringify(v)),json=v=>JSON.stringify(v),base=()=>emptyAuthoredEditJournal(3,0);
const args=(state,extra={})=>({document:3,revision:state.revision,domain:'manufacturing',key:'manufacturing',before:null,after:manufacturing(),...extra});
const record=(s=base(),extra={})=>edit(s,args(s,extra));
const back=(s,current,extra={})=>travel(s,{document:3,revision:s.revision,direction:'undo',domain:'manufacturing',key:'manufacturing',current,...extra});
const freezeCheck=v=>{if(v&&typeof v==='object'){assert.ok(Object.isFrozen(v));for(const c of Object.values(v))freezeCheck(c);}};
function charge(entry){const{byteSize,...rest}=entry,s=JSON.stringify(rest);return Math.max(new TextEncoder().encode(s).length,2*s.length);}

test('synthetic manufacturing proposal is detached, frozen and targets metadata without fake feature IDs',()=>{
 const input=manufacturing(),s=record(undefined,{after:input}),entry=s.entries[0];freezeCheck(s);
 assert.equal(s.document,3);assert.equal(s.revision,1);assert.equal(s.cursor,1);assert.equal(entry.kind,'document-metadata');
 assert.deepEqual(target(entry),{kind:'document-metadata',domain:'manufacturing',key:'manufacturing'});assert.equal(entry.byteSize,charge(entry));
 assert.equal(capture(entry),entry,'immutable admitted entries may reuse their capture');
 input.materials[0].name='caller mutation';assert.notEqual(entry.after.materials[0].name,input.materials[0].name);
 assert.ok(!('featureId' in target(entry))&&!('index' in target(entry)));
 assert.equal(json(capture(clone(entry))),json(entry));
});
test('exact manufacturing undo/redo proposals share existing session chronology without native replay claims',()=>{
 const s=record(),after=s.entries[0].after,u=back(s,after);assert.equal(u.before,after);assert.equal(u.after,null);assert.equal(u.next.cursor,0);assert.equal(u.next.revision,2);assert.equal(u.next.entries,s.entries);
 const r=travel(u.next,{document:3,revision:2,direction:'redo',domain:'manufacturing',key:'manufacturing',current:null});
 assert.equal(r.after,after);assert.equal(r.before,null);assert.equal(r.next.cursor,1);assert.equal(r.next.revision,3);assert.equal(s.cursor,1);
 // Pure plans only: no manager state, actual undo command, app or kernel ran.
});
test('drawing records reuse integrated capture but do not enable RAM-only publication or native persistence',()=>{
 const d=drawing(),s=record(undefined,{domain:'linked-part-drawing',key:d.drawingId,after:d});
 assert.deepEqual(target(s.entries[0]),{kind:'document-metadata',domain:'linked-part-drawing',key:d.drawingId});
 const u=back(s,s.entries[0].after,{domain:'linked-part-drawing',key:d.drawingId});assert.equal(u.after,null);
 const changed=drawing('after');const e=record(s,{domain:'linked-part-drawing',key:d.drawingId,before:d,after:changed});
 assert.equal(e.entries.length,2);assert.equal(e.entries[1].before.title,'before');assert.equal(e.entries[1].after.title,'after');
 const bad=drawing();bad.measurements=[10];assert.throws(()=>record(undefined,{domain:'linked-part-drawing',key:bad.drawingId,after:bad}));
 assert.throws(()=>record(undefined,{domain:'linked-part-drawing',key:'wrong',after:d}));
});
test('stale document/revision/domain/key/direction/current payload and wrong journal kind refuse unchanged',()=>{
 const s=record(),snapshot=json(s),current=s.entries[0].after;
 for(const extra of [{document:4},{revision:0},{domain:'linked-part-drawing'},{key:'other'},{direction:'back'},{current:null},{current:manufacturing(1,'modified')}])assert.throws(()=>back(s,current,extra));
 const geom=recordExtrusionEdit(base(),{document:3,revision:0,index:0,featureId:1,before:1,after:2});assert.throws(()=>back(geom,current));
 assert.throws(()=>planExtrusionTravel(s,{document:3,revision:1,direction:'undo',index:0,featureId:1,currentDepth:2}));assert.equal(json(s),snapshot);
});
test('mixed geometry/manufacturing/drawing LIFO and redo-tail branching use one journal',()=>{
 const g=recordExtrusionEdit(base(),{document:3,revision:0,index:0,featureId:1,before:1,after:2}),m=record(g),d=drawing();
 const s=record(m,{domain:'linked-part-drawing',key:d.drawingId,after:d}),du=back(s,s.entries[2].after,{domain:'linked-part-drawing',key:d.drawingId}),mu=back(du.next,s.entries[1].after);
 const gu=planExtrusionTravel(mu.next,{document:3,revision:mu.next.revision,direction:'undo',index:0,featureId:1,currentDepth:2});assert.equal(gu.depth,1);assert.equal(gu.next.cursor,0);assert.equal(gu.next.entries.length,3);
 const branched=record(mu.next,{before:manufacturing(),after:manufacturing(1,'new branch')});assert.equal(branched.entries.length,2);assert.equal(branched.cursor,2);assert.equal(s.entries.length,3);
 assert.throws(()=>travel(branched,{document:3,revision:branched.revision,direction:'redo',domain:'linked-part-drawing',key:d.drawingId,current:null}));
});
test('record fields/charge/null/noop/domain/legacy semantic conflicts fail closed',()=>{
 const s=record(),entry=clone(s.entries[0]);
 for(const change of [r=>r.byteSize++,r=>r.byteSize=true,r=>r.kind='second-stack',r=>r.version=true,r=>r.domain='presentation',r=>r.key='body',r=>r.extra=1,r=>r.after.materials[0].id='bad id']){const v=clone(entry);change(v);assert.throws(()=>capture(v));}
 assert.throws(()=>record(undefined,{after:null}));assert.throws(()=>record(undefined,{before:manufacturing()}));
 const m=manufacturing();m.objects[0].regions[0].materialId='missing';assert.throws(()=>record(undefined,{after:m}));
 const rev=emptyAuthoredEditJournal(3,Number.MAX_SAFE_INTEGER-1),last=record(rev);assert.equal(last.revision,Number.MAX_SAFE_INTEGER);assert.throws(()=>record(last));
});
test('strict JSON capture rejects symbols/accessors/prototypes/sparse/cycles and never invokes caller hooks',()=>{
 let called=0;
 for(const mutate of [v=>v[Symbol('hidden')]=1,v=>Object.setPrototypeOf(v,{inherited:1}),v=>Object.defineProperty(v,'unit',{enumerable:true,get(){called++;return'millimeter';}}),
 v=>Object.defineProperty(v.materials,'0',{enumerable:true,get(){called++;return{};}}),v=>delete v.materials[0],v=>v.materials.extra=1,v=>Object.setPrototypeOf(v.materials,{custom:1}),
 v=>v.materials[0].name=()=>{},v=>v.materials[0].name=undefined,v=>v.materials[0].name=1n,v=>v.objects[0].regions[0].transform[0]=Infinity,v=>v.materials[0].name=v,
 v=>v.toJSON=()=>{called++;return{};}]){const m=manufacturing();mutate(m);assert.throws(()=>record(undefined,{after:m}));}
 const a=args(base());Object.defineProperty(a,'domain',{enumerable:true,get(){called++;return'manufacturing';}});assert.throws(()=>edit(base(),a));assert.equal(called,0);
 const s=record(),e=clone(s.entries[0]);Object.defineProperty(e,'byteSize',{enumerable:false,value:e.byteSize});assert.throws(()=>capture(e));
});
test('canonical key ordering, Unicode charges and exact represented transform values are preserved',()=>{
 const m=manufacturing();m.materials[0].name='中'.repeat(256);const s=record(undefined,{after:m});assert.equal(s.entries[0].byteSize,charge(s.entries[0]));
 const reordered=JSON.parse(json(s.entries[0].after),(k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).reverse()):v);back(s,reordered);
 const neg=manufacturing();neg.objects[0].regions[0].transform[1]=-0;const n=record(undefined,{after:neg});assert.ok(Object.is(n.entries[0].after.objects[0].regions[0].transform[1],-0));
 assert.throws(()=>back(n,manufacturing()));back(n,n.entries[0].after);
});
test('existing metadata-v1 values retain units/escaped labels and explicit removal without applying public geometry policy',()=>{
 for(const unit of ['millimeter','micron','centimeter','meter','inch','foot']){
  const m=manufacturing();m.unit=unit;m.materials[0].name='legacy\nlabel';const s=record(undefined,{after:m});
  assert.equal(s.entries[0].after.unit,unit);assert.equal(s.entries[0].after.materials[0].name,m.materials[0].name);assert.equal(s.entries[0].byteSize,charge(s.entries[0]));
  const removed=record(s,{before:s.entries[0].after,after:null});assert.equal(removed.entries[1].after,null);
 }
 // Normal project/part admission still requires its actual supported units.
});
test('64-entry limit applies to mixed domains and legacy geometry without a separate stack',()=>{
 let s=base();for(let i=0;i<80;i++)s=i%2?recordExtrusionEdit(s,{document:3,revision:s.revision,index:0,featureId:1,before:i,after:i+1}):record(s,{after:manufacturing(1,String(i))});
 assert.equal(s.entries.length,64);assert.equal(s.cursor,64);assert.equal(s.entries[0].after.materials[0].name,'16 material 0');assert.equal(s.entries.at(-1).kind,'extrusion-depth');
});
test('heavy legacy-limit/exact shared-budget controls execute in an actual Node Worker (synthetic metadata)',async()=>{
 const worker=new Worker(new URL('./large-worker.mjs',import.meta.url));
 const result=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Metadata algorithm Worker timed out')),90000);worker.once('message',v=>{clearTimeout(timer);resolve(v);});worker.once('error',e=>{clearTimeout(timer);reject(e);});worker.once('exit',c=>{if(c)reject(Error('Metadata Worker exit '+c));});});
 await worker.terminate();assert.deepEqual(result,{legacyCompatible:true,exactCharge:8388608,oversizeRefused:true,evictionExact:true,geometryPreserved:true});
});
