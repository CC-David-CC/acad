// Pure authored data/chronology only. No model, graph, kernel or UI doubles.
import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyAuthoredEditJournal,captureOperationAppend as capture,recordOperationAppend as record,planOperationAppendTravel as travel,recordSolidEdgeTreatmentEdit as edit,planSolidEdgeTreatmentTravel as editTravel,recordExtrusionEdit,planExtrusionTravel,recordSketchEdit,planSketchTravel} from '../../web/app/cad/craft/authoredEditJournal.mjs';
import {solidBodyId} from '../../modules/engine/solid/solidIntent.mjs';
const engineRevision='sha256:'+'a'.repeat(64)+':'+'b'.repeat(64),type='WORKER_SOLID_EDGE_TREATMENT_V1';
const operation=(extra={})=>({type,params:{version:1,unit:'millimeter',engine:'occ',engineRevision,featureId:20,target:solidBodyId(10),producerFeatureId:10,kind:'fillet',edgeIds:['actual-source-edge:a','actual-source-edge:b'],size:3,...extra}});
const empty=()=>emptyAuthoredEditJournal(7,0),recordArgs=(state,op=operation(),extra={})=>({document:7,revision:state.revision,index:4,operation:op,previousFeatureId:19,...extra});
const append=(state=empty(),op=operation(),extra={})=>record(state,recordArgs(state,op,extra));
const travelArgs=(state,direction='undo',extra={})=>({document:7,revision:state.revision,direction,index:4,featureId:20,currentLength:direction==='undo'?5:4,currentOperation:direction==='undo'?operation():null,previousFeatureId:19,...extra});
const undo=(state,extra={})=>travel(state,travelArgs(state,'undo',extra));

test('canonical capture is detached frozen exact type/params for both supported edge kinds',()=>{
 for(const kind of ['fillet','chamfer-equal']){const input=operation({kind}),actual=capture(input);assert.deepEqual(actual,input);assert.deepEqual(Object.keys(actual),['type','params']);assert(Object.isFrozen(actual)&&Object.isFrozen(actual.params)&&Object.isFrozen(actual.params.edgeIds));assert.notEqual(actual.params,input.params);assert.notEqual(actual.params.edgeIds,input.params.edgeIds);input.params.size=9;input.params.edgeIds.reverse();assert.equal(actual.params.size,3);assert.equal(actual.params.edgeIds[0],'actual-source-edge:a');}
});
test('capture rejects unknown operations, numeric strings, extra saved geometry and malformed identities',()=>{
 for(const input of [null,[],{...operation(),extra:1},{...operation(),type:'WORKER_THROUGH_HOLES_V1'},{...operation(),type:1},{type},operation({featureId:'20'}),operation({producerFeatureId:'10'}),operation({size:'3'}),operation({target:solidBodyId(11)}),operation({handle:{}}),operation({sourceFeatureId:10}),operation({nativeIndex:2})])assert.throws(()=>capture(input));
 const symbol=operation();symbol[Symbol('extra')]=1;assert.throws(()=>capture(symbol));
 const inherited=Object.create({type});inherited.params=operation().params;assert.throws(()=>capture(inherited));
});
test('request, parameter and edge-array accessors are never invoked',()=>{
 let reads=0;
 for(const key of ['type','params']){const request=operation();Object.defineProperty(request,key,{enumerable:true,get(){reads++;throw Error('read');}});assert.throws(()=>capture(request));}
 for(const key of Object.keys(operation().params)){const request=operation();Object.defineProperty(request.params,key,{enumerable:true,get(){reads++;throw Error('read');}});assert.throws(()=>capture(request));}
 const request=operation();Object.defineProperty(request.params.edgeIds,'0',{enumerable:true,get(){reads++;return 'x';}});assert.throws(()=>capture(request));assert.equal(reads,0);
 const hidden=operation();Object.defineProperty(hidden,'type',{value:type,enumerable:false});assert.throws(()=>capture(hidden));
});
test('append entry holds only one captured operation and bounded tip metadata',()=>{
 const input=operation(),initial=empty(),state=append(initial,input),entry=state.entries[0];
 assert.deepEqual(Object.keys(entry).sort(),['byteSize','featureId','index','kind','operation','previousFeatureId']);assert.equal(entry.kind,'operation-append');assert.equal(entry.featureId,20);assert.equal(entry.index,4);assert.equal(entry.previousFeatureId,19);assert(Object.isFrozen(entry)&&Object.isFrozen(state)&&Object.isFrozen(state.entries));
 input.params.edgeIds[0]='changed';assert.equal(entry.operation.params.edgeIds[0],'actual-source-edge:a');assert.equal(initial.cursor,0);assert.equal(state.cursor,1);assert.equal(state.revision,1);
});
test('append supports indices 0..9999 with strict previous-tip ID/null rules',()=>{
 for(const index of [0,9999]){const state=append(empty(),operation(),{index,previousFeatureId:index===0?null:19}),back=undo(state,{index,currentLength:index+1,previousFeatureId:index===0?null:19});assert.equal(back.index,index);assert.equal(back.next.cursor,0);assert.equal(travel(back.next,travelArgs(back.next,'redo',{index,currentLength:index,previousFeatureId:index===0?null:19})).next.cursor,1);}
 for(const extra of [{index:-1},{index:10000},{index:'4'},{index:0,previousFeatureId:19},{index:1,previousFeatureId:null},{previousFeatureId:'19'},{previousFeatureId:0},{previousFeatureId:20},{previousFeatureId:Infinity}])assert.throws(()=>append(empty(),operation(),extra));
 const max=Number.MAX_SAFE_INTEGER;assert.equal(append(empty(),operation({featureId:max}),{previousFeatureId:max-1}).entries[0].featureId,max);
});
test('record/travel options are exact own-data inputs without callbacks or getters',()=>{
 const initial=empty(),state=append();let reads=0;
 for(const [fn,args] of [[a=>record(initial,a),recordArgs(initial)],[a=>travel(state,a),travelArgs(state)]]){for(const key of Object.keys(args)){const bad={...args};Object.defineProperty(bad,key,{enumerable:true,get(){reads++;return args[key];}});assert.throws(()=>fn(bad));}assert.throws(()=>fn({...args,prefix:[]}));}
 assert.equal(reads,0);
});
test('Undo/Redo travel reuses immutable entry storage and returns the canonical operation',()=>{
 const state=append(),back=undo(state),forward=travel(back.next,travelArgs(back.next,'redo'));
 assert.equal(back.operation,state.entries[0].operation);assert.equal(forward.operation,back.operation);assert(Object.isFrozen(back)&&Object.isFrozen(forward));assert.equal(back.next.entries,state.entries);assert.equal(forward.next.entries,state.entries);assert.equal(back.next.cursor,0);assert.equal(forward.next.cursor,1);assert.equal(forward.next.revision,3);assert.equal(state.cursor,1);
 const reordered={params:{...operation().params,edgeIds:[...operation().params.edgeIds]},type};assert.equal(undo(state,{currentOperation:reordered}).featureId,20);
});
test('every full parameter/runtime/source-key mutation refuses Undo unchanged',()=>{
 const state=append(),before=JSON.stringify(state);
 for(const change of [{version:2},{unit:'inch'},{engine:'manifold'},{engineRevision:'sha256:'+'c'.repeat(64)+':'+'b'.repeat(64)},{featureId:21},{producerFeatureId:11,target:solidBodyId(11)},{kind:'chamfer-equal'},{edgeIds:['actual-source-edge:b','actual-source-edge:a']},{edgeIds:['another-source-edge','actual-source-edge:b']},{edgeIds:['actual-source-edge:a']},{size:2}])assert.throws(()=>undo(state,{currentOperation:operation(change)}));
 assert.throws(()=>undo(state,{currentOperation:{...operation(),type:'other'}}));assert.equal(JSON.stringify(state),before);
});
test('stale document/revision/index/feature/tip length/previous ID and present Redo slots refuse',()=>{
 const state=append();for(const change of [{document:8},{revision:0},{direction:'back'},{index:5},{featureId:21},{featureId:'20'},{currentLength:4},{currentLength:6},{currentLength:'5'},{currentLength:10001},{previousFeatureId:18},{previousFeatureId:null},{currentOperation:null}])assert.throws(()=>undo(state,change));
 const back=undo(state);for(const currentOperation of [undefined,operation(),{},false])assert.throws(()=>travel(back.next,travelArgs(back.next,'redo',{currentOperation})));
 assert.throws(()=>travel(back.next,travelArgs(back.next,'redo',{currentLength:5})));assert.throws(()=>travel(back.next,travelArgs(back.next,'redo',{previousFeatureId:18})));assert.equal(back.next.cursor,0);
});
test('real helper composition preserves creation then size-edit chronology in both directions',()=>{
 const op=operation();let state=append(empty(),op),current=op;
 state=edit(state,{document:7,revision:state.revision,index:4,featureId:20,parameters:current.params,after:2});current={type,params:{...current.params,size:2}};
 assert.throws(()=>undo(state,{currentOperation:current}));
 let editPlan=editTravel(state,{document:7,revision:state.revision,direction:'undo',index:4,featureId:20,parameters:current.params});state=editPlan.next;current={type,params:{...current.params,size:editPlan.size}};assert.equal(current.params.size,3);
 let createPlan=undo(state,{currentOperation:current});state=createPlan.next;current=null;assert.equal(state.cursor,0);
 createPlan=travel(state,travelArgs(state,'redo',{currentOperation:current}));state=createPlan.next;current=createPlan.operation;assert.equal(current.params.size,3);
 editPlan=editTravel(state,{document:7,revision:state.revision,direction:'redo',index:4,featureId:20,parameters:current.params});state=editPlan.next;current={type,params:{...current.params,size:editPlan.size}};assert.equal(current.params.size,2);assert.equal(state.cursor,2);assert.equal(state.revision,6);
});
test('branching after creation Undo truncates only the redo tail in the same journal',()=>{
 let state=recordExtrusionEdit(empty(),{document:7,revision:0,index:0,featureId:1,before:10,after:20});state=append(state);const oldEntry=state.entries[1],back=undo(state),branch=append(back.next,operation({featureId:21}),{previousFeatureId:19});
 assert.equal(branch.entries.length,2);assert.equal(branch.entries[0],state.entries[0]);assert.notEqual(branch.entries[1],oldEntry);assert.equal(branch.entries[1].featureId,21);assert.throws(()=>travel(branch,travelArgs(branch,'redo')));assert.equal(state.entries[1],oldEntry);
});
test('mixed old journal entries keep their order, storage and existing travel semantics',()=>{
 let state=recordExtrusionEdit(empty(),{document:7,revision:0,index:0,featureId:1,before:10,after:20});state=append(state);state=recordSketchEdit(state,{document:7,revision:state.revision,faceId:'source',before:'old',after:'new'});
 assert.throws(()=>undo(state));const sketch=planSketchTravel(state,{document:7,revision:state.revision,direction:'undo',faceId:'source',currentBytes:'new'}),creation=undo(sketch.next),old=planExtrusionTravel(creation.next,{document:7,revision:creation.next.revision,direction:'undo',index:0,featureId:1,currentDepth:20});assert.equal(old.depth,10);assert.equal(old.next.cursor,0);assert.equal(old.next.entries,state.entries);
});
test('64-entry cap still retains the latest appends and preserves proposal-only mutation',()=>{
 let state=empty();for(let i=0;i<70;i++)state=append(state,operation({featureId:100+i}),{index:i,previousFeatureId:i?99+i:null});assert.equal(state.entries.length,64);assert.equal(state.entries[0].featureId,106);assert.equal(state.cursor,64);assert.equal(state.revision,70);assert.equal(undo(state,{index:69,featureId:169,currentLength:70,currentOperation:operation({featureId:169}),previousFeatureId:168}).next.cursor,63);
});
test('byte accounting matches independent full serialized UTF8/UTF16 oracle including surrogate boundaries',()=>{
 for(const text of ['ASCII','界'.repeat(16300),'\u0000'.repeat(16300),'😀'.repeat(8150),'a'.repeat(1023)+'😀'+'x'.repeat(1023)+'\ud800\udfff\ud800']){const entry=append(empty(),operation({edgeIds:[text]})).entries[0],serialized=JSON.stringify(entry.operation);assert.equal(entry.byteSize,256+Math.max(2*serialized.length,new TextEncoder().encode(serialized).byteLength));assert(entry.byteSize<=8*1024*1024);}
});
test('accounting only serializes small fragments even with sixteen maximum opaque IDs',()=>{
 const ids=Array.from({length:16},(_,i)=>{const prefix=String(i)+':';return prefix+'\u0000'.repeat(16384-prefix.length);}),request=operation({edgeIds:ids}),original=JSON.stringify,OriginalEncoder=globalThis.TextEncoder;let longest=0,largestEncoded=0;
 try{globalThis.TextEncoder=class extends OriginalEncoder{encode(input){const output=super.encode(input);assert(input.length<=16384);assert(output.byteLength<=16384);largestEncoded=Math.max(largestEncoded,output.byteLength);return output;}};JSON.stringify=function(value,...rest){if(typeof value==='string'){longest=Math.max(longest,value.length);assert(value.length<=1024);}else{assert(Array.isArray(value));assert.equal(value.length,2);assert.equal(typeof value[0],'number');assert.equal(value[1],'body');}return original(value,...rest);};const state=append(empty(),request);assert(state.entries[0].byteSize>3*1024*1024);assert(longest<=1024);assert(largestEncoded<=16384);}finally{JSON.stringify=original;globalThis.TextEncoder=OriginalEncoder;}
});
test('8MiB trimming charges new entries together with old snapshots and size-edit records',()=>{
 const edgeIds=Array.from({length:16},(_,i)=>String(i)+':'+ '\u0000'.repeat(16380));let state=empty();for(let i=0;i<5;i++)state=append(state,operation({featureId:20+i,edgeIds}),{previousFeatureId:19+i});const cost=state.entries[0].byteSize;assert.equal(state.entries.length,Math.floor(8*1024*1024/cost));assert(state.entries.reduce((sum,e)=>sum+e.byteSize,0)<=8*1024*1024);assert(undo(state,{featureId:24,previousFeatureId:23,currentOperation:operation({featureId:24,edgeIds})}));
 let mixed=recordSketchEdit(empty(),{document:7,revision:0,faceId:'source',before:'a'.repeat(1024*1024),after:'b'.repeat(1024*1024)});mixed=append(mixed,operation({edgeIds}));mixed=edit(mixed,{document:7,revision:mixed.revision,index:4,featureId:20,parameters:operation({edgeIds}).params,after:2});assert(!mixed.entries.some(e=>e.kind==='sketch-bytes'));assert.deepEqual(mixed.entries.map(e=>e.kind),['operation-append','solid-edge-treatment']);assert(mixed.entries.reduce((sum,e)=>sum+e.byteSize,0)<=8*1024*1024);
});
