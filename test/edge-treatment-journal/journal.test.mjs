import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyAuthoredEditJournal,captureSolidEdgeTreatmentParameters as capture,recordSolidEdgeTreatmentEdit as edit,planSolidEdgeTreatmentTravel as travel,recordSelectedProfileDepthEdit,planSelectedProfileDepthTravel,recordSolidBoxEdit,planSolidBoxTravel,recordExtrusionEdit,planExtrusionTravel,recordSketchEdit} from '../../web/app/cad/craft/authoredEditJournal.mjs';
import {solidBodyId} from '../../modules/engine/solid/solidIntent.mjs';
const revision='sha256:'+'a'.repeat(64)+':'+'b'.repeat(64);
const edge=(a,b)=>'worker-prism-selection:1:'+JSON.stringify([10,'sketch-region:fixture','edge','connector',[a,b]]);
const defaults={version:1,unit:'millimeter',engine:'occ',engineRevision:revision,featureId:17,target:solidBodyId(10),producerFeatureId:10,kind:'fillet',edgeIds:[edge('a','b'),edge('c','d')],size:3};
const parameters=extra=>({...defaults,edgeIds:defaults.edgeIds.slice(),...extra});
const args={document:4,revision:0,index:2,featureId:17};
const base=()=>emptyAuthoredEditJournal(4,0),record=(state=base(),extra={})=>edit(state,{...args,parameters:parameters(),after:2,...extra});
const undo=(state,extra={})=>travel(state,{...args,revision:state.revision,direction:'undo',parameters:parameters({size:2}),...extra});

test('capture detaches the exact ordered data-only edge identity',()=>{
 const input=parameters(),captured=capture(input);assert(Object.isFrozen(captured)&&Object.isFrozen(captured.edgeIds));assert.deepEqual(captured,input);assert.notEqual(captured.edgeIds,input.edgeIds);
 input.edgeIds.reverse();input.size=7;assert.deepEqual(captured.edgeIds,defaults.edgeIds);assert.equal(captured.size,3);
});
test('only size changes with exact proposed undo and redo',()=>{
 const initial=base(),state=record(initial),entry=state.entries[0];assert.equal(entry.kind,'solid-edge-treatment');assert.equal(entry.before,3);assert.equal(entry.after,2);assert.equal(entry.identity.target,defaults.target);assert.deepEqual(entry.identity.edgeIds,defaults.edgeIds);assert(Object.isFrozen(entry.identity)&&Object.isFrozen(entry.identity.edgeIds));assert(!('size'in entry.identity)&&!('featureId'in entry.identity));
 const back=undo(state);assert.equal(back.size,3);assert.equal(back.next.revision,2);assert.equal(back.next.cursor,0);assert.equal(back.next.entries,state.entries);
 const forward=travel(back.next,{...args,revision:2,direction:'redo',parameters:parameters()});assert.equal(forward.size,2);assert.equal(forward.next.cursor,1);assert.equal(forward.next.entries,state.entries);assert.equal(initial.cursor,0);assert.equal(state.cursor,1);
});
test('every immutable identity change including valid alternate target refuses',()=>{
 const state=record(),before=JSON.stringify(state),changes=[{version:2},{unit:'inch'},{engine:'manifold'},{engineRevision:'sha256:'+'c'.repeat(64)+':'+'b'.repeat(64)},{featureId:18},{target:solidBodyId(11)},{producerFeatureId:11,target:solidBodyId(11)},{kind:'chamfer-equal'},{edgeIds:defaults.edgeIds.slice().reverse()},{edgeIds:[defaults.edgeIds[0],'another-opaque-edge']},{edgeIds:[defaults.edgeIds[0]]},{edgeIds:[...defaults.edgeIds,'third-edge']},{size:2.5}];
 for(const change of changes)assert.throws(()=>undo(state,{parameters:parameters({size:2,...change})}),JSON.stringify(change));
 assert.equal(JSON.stringify(state),before);assert.equal(undo(state,{parameters:JSON.parse(JSON.stringify(parameters({size:2})))}).size,3,'value equality does not require shared array references');
});
test('stale document/revision/index/feature and missing history refuse unchanged',()=>{
 const state=record(),before=JSON.stringify(state);for(const change of[{document:5},{revision:2},{index:3},{featureId:18},{direction:'back'}])assert.throws(()=>undo(state,change));assert.throws(()=>travel(base(),{...args,direction:'undo',parameters:parameters()}));assert.throws(()=>travel(state,{...args,revision:1,direction:'redo',parameters:parameters()}));assert.equal(JSON.stringify(state),before);
});
test('invalid and unchanged size proposals never create journal churn',()=>{
 const state=base(),before=JSON.stringify(state);for(const after of[0,-0,-1,NaN,Infinity,1e6+1,'2','wall',3])assert.throws(()=>record(state,{after}));assert.throws(()=>record(state,{revision:1}));assert.throws(()=>record(state,{parameters:parameters({featureId:18})}));assert.equal(JSON.stringify(state),before);
 for(const after of[Number.MIN_VALUE,1e6])assert.equal(record(state,{after}).entries[0].after,after,'numeric admission is separate from kernel feasibility');
});
test('canonical logical target and scalar native-identity guards refuse corruption',()=>{
 for(const p of[parameters({version:true}),parameters({featureId:10}),parameters({producerFeatureId:0}),parameters({producerFeatureId:'10'}),parameters({target:'edge:1'}),parameters({target:10}),parameters({target:{mountId:'native',id:1}}),parameters({engineRevision:'sha256:unknown'}),parameters({edgeIds:[7]})])assert.throws(()=>capture(p));
 for(const key of['handle','nativeIndex','resultLocal','mesh','geometry','profile','ptr'])assert.throws(()=>capture({...parameters(),[key]:{}}),key);
});
test('fields and dense bounded edge arrays do not evaluate accessors',()=>{
 for(const key of Object.keys(defaults)){let reads=0;const p=parameters();Object.defineProperty(p,key,{enumerable:true,get(){reads++;return defaults[key];}});assert.throws(()=>capture(p));assert.equal(reads,0,key);}
 let reads=0;const ids=defaults.edgeIds.slice();Object.defineProperty(ids,'0',{enumerable:true,get(){reads++;return defaults.edgeIds[0];}});assert.throws(()=>capture(parameters({edgeIds:ids})));assert.equal(reads,0);
 for(const edgeIds of[[],Array(1),[defaults.edgeIds[0],defaults.edgeIds[0]],Array.from({length:17},(_,i)=>String(i)),['x'.repeat(16385)],[true],[''],[undefined]])assert.throws(()=>capture(parameters({edgeIds})));
 const extra=defaults.edgeIds.slice();extra.nativeIndex=3;assert.throws(()=>capture(parameters({edgeIds:extra})));assert.equal(capture(parameters({edgeIds:['x'.repeat(16384)]})).edgeIds[0].length,16384);
});
test('journal retains detached immutable selections after caller mutation',()=>{
 const p=parameters(),state=record(base(),{parameters:p});p.edgeIds[0]='changed';p.kind='chamfer-equal';p.target=solidBodyId(11);assert.deepEqual(state.entries[0].identity.edgeIds,defaults.edgeIds);assert.equal(state.entries[0].identity.kind,'fillet');assert.equal(state.entries[0].identity.target,defaults.target);assert.equal(undo(state).size,3);
});
test('new size edit after undo truncates only redo tail',()=>{
 const first=record(),second=record(first,{revision:1,parameters:parameters({size:2}),after:1.5}),back=undo(second,{parameters:parameters({size:1.5})}),branch=record(back.next,{revision:back.next.revision,parameters:parameters({size:2}),after:4});assert.equal(branch.entries.length,2);assert.equal(branch.entries[0],first.entries[0]);assert.equal(branch.entries[1].after,4);assert.equal(second.entries[1].after,1.5);assert.throws(()=>travel(branch,{...args,revision:branch.revision,direction:'redo',parameters:parameters({size:4})}));
});
test('ordinary64-entry bound preserves exact latest size',()=>{
 let state=base();for(let i=0;i<70;i++)state=record(state,{revision:state.revision,parameters:parameters({size:i+1}),after:i+2});assert.equal(state.entries.length,64);assert.equal(state.cursor,64);assert.equal(state.revision,70);assert.equal(undo(state,{parameters:parameters({size:71})}).size,70);
});
test('travel isolates edge treatment from old scalar and box kinds',()=>{
 const rectangle=recordExtrusionEdit(base(),{...args,before:3,after:2});assert.throws(()=>undo(rectangle),/No solid edge-treatment/);
 const selected={version:1,unit:'millimeter',engine:'occ',engineRevision:revision,featureId:17,faceId:'plane',regionId:'sketch-region:fixture',depth:3,bodyPolicy:'separate'},s=recordSelectedProfileDepthEdit(base(),{...args,parameters:selected,after:2});assert.throws(()=>undo(s),/No solid edge-treatment/);
 const dims={x:0,y:0,z:0,width:10,depth:3,height:5},b=recordSolidBoxEdit(base(),{...args,engine:'occ',engineRevision:revision,before:dims,after:{...dims,depth:2}});assert.throws(()=>undo(b),/No solid edge-treatment/);assert.equal(planSolidBoxTravel(b,{...args,revision:1,direction:'undo',engine:'occ',engineRevision:revision,current:{...dims,depth:2}}).values.depth,3);
 assert.throws(()=>planSelectedProfileDepthTravel(record(),{...args,revision:1,direction:'undo',parameters:{...selected,depth:2}}),/No selected-profile/);
 for(const state of[record(),s])assert.throws(()=>planExtrusionTravel(state,{...args,revision:1,direction:'undo',currentDepth:2}),/No authored edit/);
 assert.equal(planExtrusionTravel(rectangle,{...args,revision:1,direction:'undo',currentDepth:2}).depth,3);
});
test('identity byte charge matches serialized UTF8 and UTF16 exactly',()=>{
 for(const text of['ASCII','界'.repeat(1000),'\u0000'.repeat(1000),'😀'.repeat(1000)]){const entry=record(base(),{parameters:parameters({edgeIds:['a:'+text,'b:'+text]})}).entries[0],serialized=JSON.stringify(entry.identity);assert.equal(entry.byteSize,256+Math.max(2*serialized.length,new TextEncoder().encode(serialized).byteLength));}
});
test('large identities evict by bytes and coexist with old snapshots',()=>{
 const large=parameters({edgeIds:Array.from({length:16},(_,i)=>String(i)+':'+ '\u0000'.repeat(16380))});let state=base();for(let i=0;i<5;i++)state=record(state,{revision:state.revision,parameters:{...large,size:i+1},after:i+2});const cost=state.entries[0].byteSize;assert(cost>3*1024*1024);assert.equal(state.entries.length,Math.floor(8*1024*1024/cost));assert(state.entries.reduce((sum,e)=>sum+e.byteSize,0)<=8*1024*1024);assert.equal(undo(state,{parameters:{...large,size:6}}).size,5);
 let mixed=recordSketchEdit(base(),{...args,faceId:'plane',before:'a'.repeat(1024*1024),after:'b'.repeat(1024*1024)});mixed=record(mixed,{revision:1,parameters:large,after:2});mixed=record(mixed,{revision:2,parameters:{...large,size:2},after:3});assert(mixed.entries.every(e=>e.kind==='solid-edge-treatment'));assert(mixed.entries.reduce((sum,e)=>sum+e.byteSize,0)<=8*1024*1024);
});
