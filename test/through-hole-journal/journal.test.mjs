import test from 'node:test';import assert from 'node:assert/strict';
import {emptyAuthoredEditJournal,captureThroughHoleParameters as capture,recordThroughHoleEdit as edit,planThroughHoleTravel as travel,recordSketchEdit,recordSelectedProfileDepthEdit,planSelectedProfileDepthTravel,recordSolidEdgeTreatmentEdit,planSolidEdgeTreatmentTravel,recordExtrusionEdit,planExtrusionTravel} from '../../web/app/cad/craft/authoredEditJournal.mjs';
import{captureOwnedHoleIntent}from'../../modules/engine/solid/ownedHoleIntent.mjs';
const revision='sha256:'+'a'.repeat(64)+':'+'b'.repeat(64),body=id=>'worker-solid:1:'+JSON.stringify([id,'body']);
const centered=()=>({version:1,unit:'millimeter',engine:'occ',engineRevision:revision,featureId:20,target:body(10),producerFeatureId:10,sourceFeatureId:10,sourceFaceId:'source-plane',sourceRegionId:'sketch-region:source',kind:'centered-through',diameter:10});
const corners=()=>({...centered(),featureId:21,target:body(20),producerFeatureId:20,kind:'four-corner-through',diameter:4,offsetX:8,offsetY:9});
const base=()=>emptyAuthoredEditJournal(7,0),record=(state,p,after)=>edit(state,{document:7,revision:state.revision,index:3,featureId:p.featureId,parameters:p,after}),plan=(state,p,direction='undo')=>travel(state,{document:7,revision:state.revision,index:3,featureId:p.featureId,parameters:p,direction});
test('capture is the canonical full12/14 authored parser; detached frozen primitives only',()=>{
 for(const parameters of[centered(),corners()]){const c=capture(parameters);assert.deepEqual(c,captureOwnedHoleIntent(parameters));assert(Object.isFrozen(c));assert.notEqual(c,parameters);assert.equal(Object.keys(c).length,parameters.kind==='centered-through'?12:14);parameters.sourceFaceId='changed';assert.equal(c.sourceFaceId,'source-plane');}
 const p=Object.assign(Object.create(null),corners());assert.deepEqual(capture(p),captureOwnedHoleIntent(p));
});
for(const [name,make,after]of[['center',centered,{diameter:12.5}],['corners',corners,{diameter:5.5,offsetX:10,offsetY:11}]])test(`${name}: immutable full identity and exact UndoRedo dimensions`,()=>{
 const p=make(),state=base(),j=record(state,p,after),e=j.entries[0];assert.equal(state.entries.length,0);assert.equal(j.revision,1);assert.equal(j.cursor,1);assert.equal(e.kind,'through-hole');assert(Object.isFrozen(e));assert(Object.isFrozen(e.identity));assert(Object.isFrozen(e.before));assert(Object.isFrozen(e.after));assert.equal(e.identity.featureId,p.featureId);assert.equal(e.identity.kind,p.kind);assert(!Object.hasOwn(e.identity,'diameter'));assert.equal(Object.keys(e.identity).length,11);assert.deepEqual(e.after,after);
 const undo=plan(j,{...p,...after});assert.deepEqual(undo.dimensions,Object.fromEntries(Object.keys(after).map(k=>[k,p[k]])));assert.equal(undo.next.cursor,0);assert.equal(undo.next.revision,2);assert.equal(undo.next.entries,j.entries);assert(Object.isFrozen(undo));assert(Object.isFrozen(undo.dimensions));
 const redo=plan(undo.next,p,'redo');assert.deepEqual(redo.dimensions,after);assert.equal(redo.next.cursor,1);assert.equal(redo.next.revision,3);assert.equal(j.cursor,1);assert.deepEqual(e.after,after);
});
test('before/after dimensions and identity are detached from caller mutation',()=>{
 const p=corners(),after={diameter:5,offsetX:10,offsetY:11},j=record(base(),p,after);p.diameter=99;p.sourceRegionId='changed';after.offsetX=99;assert.equal(j.entries[0].before.diameter,4);assert.equal(j.entries[0].identity.sourceRegionId,'sketch-region:source');assert.equal(j.entries[0].after.offsetX,10);
});
test('offset-only edits are authored while exact numeric no-ops refuse',()=>{
 const p=corners(),j=record(base(),p,{diameter:4,offsetX:8,offsetY:10});assert.deepEqual(plan(j,{...p,offsetY:10}).dimensions,{diameter:4,offsetX:8,offsetY:9});
 assert.throws(()=>record(base(),centered(),{diameter:10}));assert.throws(()=>record(base(),p,{diameter:4,offsetX:8,offsetY:9}));
});
test('stale document/revision/index/feature or numeric current dimensions refuse without changing journal',()=>{
 const p=corners(),after={diameter:5,offsetX:10.1,offsetY:11},j=record(base(),p,after),raw=JSON.stringify(j),args={document:7,revision:1,index:3,featureId:21,parameters:{...p,...after},direction:'undo'};
 for(const changes of[{document:8},{revision:0},{index:4},{featureId:22},{parameters:{...p,...after,diameter:5.1}},{parameters:{...p,...after,offsetX:10.100000000000001}},{parameters:{...p,...after,offsetY:11.1}},{direction:'sideways'}])assert.throws(()=>travel(j,{...args,...changes}));
 assert.equal(JSON.stringify(j),raw);assert.throws(()=>record(base(),p,{diameter:0,offsetX:8,offsetY:9}));
 assert.throws(()=>edit(base(),{document:8,revision:0,index:3,featureId:21,parameters:p,after}));assert.throws(()=>edit(base(),{document:7,revision:1,index:3,featureId:21,parameters:p,after}));
});
test('every valid altered source/target/runtime identity refuses even with matching dimensions',()=>{
 const p=centered(),j=record(base(),p,{diameter:12}),current={...p,diameter:12};
 const changes=[{engineRevision:'sha256:'+'c'.repeat(64)+':'+'b'.repeat(64)},{sourceFeatureId:11},{sourceFaceId:'another-plane'},{sourceRegionId:'another-region'},{producerFeatureId:11,target:body(11)},{featureId:22},{kind:'four-corner-through',offsetX:8,offsetY:9}];
 for(const change of changes){const parameters={...current,...change};assert.doesNotThrow(()=>capture(parameters));assert.throws(()=>plan(j,parameters));}
});
test('invalid parameter fields and non-numeric dimensions never coerce or enter journal',()=>{
 const p=centered();for(const change of[{unit:'inch'},{engine:'manifold'},{engineRevision:'latest'},{version:2},{featureId:10},{sourceFeatureId:20},{target:'native-handle'},{sourceFaceId:''},{sourceRegionId:''},{diameter:'10'},{diameter:0},{diameter:NaN},{diameter:Infinity},{diameter:1e6+1},{offsetX:8}])assert.throws(()=>capture({...p,...change}));
 for(const after of[{diameter:0},{diameter:-1},{diameter:NaN},{diameter:Infinity},{diameter:1e6+1},{diameter:'12'},{diameter:12,unknown:1},{diameter:12,offsetX:8},{},[]])assert.throws(()=>record(base(),p,after));
 const c=corners();for(const after of[{diameter:5,offsetX:8},{diameter:5,offsetX:0,offsetY:9},{diameter:5,offsetX:8,offsetY:'9'},{diameter:5,offsetX:8,offsetY:9,sourceFeatureId:11}])assert.throws(()=>record(base(),c,after));
});
test('source and editable dimension getters are refused without invoking them',()=>{
 let calls=0;for(const field of['diameter','kind','sourceFeatureId','sourceRegionId']){const p=centered();Object.defineProperty(p,field,{enumerable:true,get(){calls++;return 12;}});assert.throws(()=>capture(p));}
 const after={diameter:12};Object.defineProperty(after,'diameter',{enumerable:true,get(){calls++;return 12;}});assert.throws(()=>record(base(),centered(),after));assert.equal(calls,0);
 const p=corners(),j=record(base(),p,{diameter:5,offsetX:10,offsetY:11}),current={...p,diameter:5,offsetX:10,offsetY:11};Object.defineProperty(current,'offsetY',{enumerable:true,get(){calls++;return 11;}});assert.throws(()=>plan(j,current));assert.equal(calls,0);
});
test('positive finite primitive extremes remain exact; no journal-side unit conversion or rounding',()=>{
 const p=centered(),after={diameter:Number.MIN_VALUE},j=record(base(),p,after);assert.equal(j.entries[0].after.diameter,Number.MIN_VALUE);assert.equal(plan(j,{...p,...after}).dimensions.diameter,10);const max=record(base(),p,{diameter:1e6});assert.equal(max.entries[0].after.diameter,1e6);
});
test('Undo followed by a new edit discards redo branch while leaving old proposals immutable',()=>{
 const p=centered(),j=record(base(),p,{diameter:12}),u=plan(j,{...p,diameter:12}),next=record(u.next,p,{diameter:14});assert.equal(next.entries.length,1);assert.equal(next.entries[0].after.diameter,14);assert.equal(next.cursor,1);assert.throws(()=>plan(next,{...p,diameter:14},'redo'));assert.equal(j.entries[0].after.diameter,12);assert.equal(u.next.cursor,0);
});
test('64-entry cap trims oldest through-hole edits with correct cursor and revision',()=>{
 let p=centered(),j=base();for(let i=0;i<80;i++){j=record(j,p,{diameter:11+i});p={...p,diameter:11+i};}
 assert.equal(j.entries.length,64);assert.equal(j.cursor,64);assert.equal(j.revision,80);assert.equal(j.entries[0].before.diameter,26);assert.equal(j.entries.at(-1).after.diameter,90);assert.equal(plan(j,p).dimensions.diameter,89);
});
test('full canonical identity and both dimension objects are conservatively byte-charged',()=>{
 const p={...corners(),sourceFaceId:'界'.repeat(256),sourceRegionId:'\0'.repeat(8192)},after={diameter:5.5,offsetX:9.1,offsetY:10.2},j=record(base(),p,after),e=j.entries[0],measure=x=>{const s=JSON.stringify(x);return Math.max(2*s.length,new TextEncoder().encode(s).byteLength);};assert.equal(e.byteSize,256+measure(e.identity)+measure(e.before)+measure(e.after));assert(e.byteSize>98000);
});
test('aggregate8MiB trim counts through-hole byteSize instead of the generic256byte estimate',()=>{
 const large='a'.repeat(1048000),other='b'.repeat(1048000);let j=base();for(let i=0;i<2;i++)j=recordSketchEdit(j,{document:7,revision:j.revision,faceId:'s'+i,before:large,after:other});assert.equal(j.entries.length,2);assert(j.entries.reduce((s,e)=>s+e.byteSize,0)<8*1024*1024);
 j=record(j,{...centered(),sourceRegionId:'r'.repeat(8192)},{diameter:12});assert.equal(j.entries.length,2);assert.equal(j.entries[0].faceId,'s1');assert.equal(j.entries[1].kind,'through-hole');assert.equal(j.cursor,2);assert(j.entries.reduce((s,e)=>s+e.byteSize,0)<=8*1024*1024);
});
test('new through-hole kind cannot travel unrelated scalar entries and old scalar planners reject it',()=>{
 const args={document:7,revision:0,index:3,featureId:20},p=centered(),j=record(base(),p,{diameter:12});
 assert.throws(()=>planExtrusionTravel(j,{...args,revision:1,direction:'undo',currentDepth:12}),/No authored edit/);
 const selected={version:1,unit:'millimeter',engine:'occ',engineRevision:revision,featureId:20,faceId:'source-plane',regionId:'sketch-region:source',depth:10,bodyPolicy:'separate'},s=recordSelectedProfileDepthEdit(base(),{...args,parameters:selected,after:12});assert.throws(()=>plan(s,{...p,diameter:12}),/No source-bound through-hole/);assert.throws(()=>planSelectedProfileDepthTravel(j,{...args,revision:1,direction:'undo',parameters:{...selected,depth:12}}),/No selected-profile/);
 const edge={version:1,unit:'millimeter',engine:'occ',engineRevision:revision,featureId:20,target:body(10),producerFeatureId:10,kind:'fillet',edgeIds:['edge'],size:10},e=recordSolidEdgeTreatmentEdit(base(),{...args,parameters:edge,after:12});assert.throws(()=>plan(e,{...p,diameter:12}),/No source-bound through-hole/);assert.throws(()=>planSolidEdgeTreatmentTravel(j,{...args,revision:1,direction:'undo',parameters:{...edge,size:12}}),/No solid edge-treatment/);
 const x=recordExtrusionEdit(base(),{...args,before:10,after:12});assert.throws(()=>plan(x,{...p,diameter:12}),/No source-bound through-hole/);
});
