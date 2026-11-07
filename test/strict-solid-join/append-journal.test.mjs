// Authored-history controls only; native geometry and browser travel are separate.
import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyAuthoredEditJournal,captureOperationAppend,recordOperationAppend,planOperationAppendTravel,recordSolidBoxEdit,planSolidBoxTravel} from '../../web/app/cad/craft/authoredEditJournal.mjs';
const revision='sha256:'+'a'.repeat(64)+':'+'b'.repeat(64);
const box=(engine='occ',extra={})=>({type:'WORKER_SOLID_BOX_V1',params:{version:1,unit:'millimeter',engine,engineRevision:revision,featureId:1,x:0,y:0,z:0,width:20,depth:10,height:5,...extra}});
const boolean=(engine='occ',kind='join',extra={})=>({type:'WORKER_SOLID_BOOLEAN_V1',params:{version:1,unit:'millimeter',engine,engineRevision:revision,featureId:3,kind,a:'body-a',b:'body-b',...extra}});
const initial=()=>emptyAuthoredEditJournal(2,0);
const append=(state,operation,index=0,previousFeatureId=null)=>recordOperationAppend(state,{document:2,revision:state.revision,index,operation,previousFeatureId});
const travel=(state,direction,operation,index=0,previousFeatureId=null)=>planOperationAppendTravel(state,{document:2,revision:state.revision,direction,index,featureId:operation.params.featureId,currentLength:direction==='undo'?index+1:index,currentOperation:direction==='undo'?operation:null,previousFeatureId});

test('each backend retains detached exact box and Boolean authored data, including Join intent',()=>{
 for(const engine of ['occ','smlib','manifold'])for(const operation of [box(engine),...['join','union','subtract','common'].map(kind=>boolean(engine,kind))]){
  const captured=captureOperationAppend(operation);
  assert.deepEqual(captured,operation);assert.notEqual(captured.params,operation.params);
  assert(Object.isFrozen(captured)&&Object.isFrozen(captured.params));
  const index=operation.type==='WORKER_SOLID_BOX_V1'?0:2,previous=index?2:null;
  const state=append(initial(),operation,index,previous),back=travel(state,'undo',operation,index,previous),forward=travel(back.next,'redo',operation,index,previous);
  assert.deepEqual(forward.operation,captured);assert.equal(forward.next.cursor,1);
  assert.equal(forward.next.revision,3);assert.equal(state.cursor,1);
  const serialized=JSON.stringify(captured);
  assert.equal(state.entries[0].byteSize,256+Math.max(2*serialized.length,new TextEncoder().encode(serialized).length));
 }
});

test('box creation, box dimension edit and Boolean creation share one ordered chronology',()=>{
 const a=box(),b=box('occ',{featureId:2,x:10}),join=boolean();
 let state=append(initial(),a);state=append(state,b,1,1);
 const before={x:10,y:0,z:0,width:20,depth:10,height:5},after={...before,width:25};
 state=recordSolidBoxEdit(state,{document:2,revision:state.revision,index:1,featureId:2,engine:'occ',engineRevision:revision,before,after});
 state=append(state,join,2,2);
 assert.equal(state.entries.length,4);assert.throws(()=>travel(state,'undo',b,1,1));
 state=travel(state,'undo',join,2,2).next;
 const edit=planSolidBoxTravel(state,{document:2,revision:state.revision,direction:'undo',index:1,featureId:2,engine:'occ',engineRevision:revision,current:after});
 state=edit.next;assert.deepEqual(edit.values,before);
 state=travel(state,'undo',b,1,1).next;state=travel(state,'undo',a).next;
 assert.equal(state.cursor,0);
 state=travel(state,'redo',a).next;state=travel(state,'redo',b,1,1).next;
 state=planSolidBoxTravel(state,{document:2,revision:state.revision,direction:'redo',index:1,featureId:2,engine:'occ',engineRevision:revision,current:before}).next;
 const final=travel(state,'redo',join,2,2);assert.equal(final.operation.params.kind,'join');assert.equal(final.next.cursor,4);
});

test('changed operand, Join intent, build or dimensions cannot silently replace a creation during Undo',()=>{
 for(const operation of [box(),boolean()]){
  const state=append(initial(),operation),snapshot=JSON.stringify(state);
  const changes=operation.type==='WORKER_SOLID_BOX_V1'?[{width:21},{x:2}]:[{kind:'union'},{a:'other-a'},{b:'other-b'}];
  for(const extra of [...changes,{engine:'smlib'},{engineRevision:revision.replaceAll('a','c')}]){
   const changed={...operation,params:{...operation.params,...extra}};
   assert.throws(()=>travel(state,'undo',changed));
  }
  assert.equal(JSON.stringify(state),snapshot);
 }
});

test('box and Boolean capture refuse accessors and extra derived data without reading getters',()=>{
 let reads=0;
 for(const operation of [box(),boolean()])for(const key of Object.keys(operation.params)){
  const params={...operation.params};Object.defineProperty(params,key,{enumerable:true,get(){reads++;throw Error('read');}});
  assert.throws(()=>captureOperationAppend({...operation,params}));
 }
 assert.equal(reads,0);
 for(const operation of [box('occ',{width:0}),box('occ',{x:Infinity}),box('occ',{width:'20'}),boolean('occ','join',{a:'body-b'}),boolean('occ','heal'),boolean('occ','join',{mesh:[]}),box('occ',{shapeHandle:'native'})])assert.throws(()=>captureOperationAppend(operation));
});

test('opaque operand Unicode IDs are charged exactly without retaining runtime geometry',()=>{
 for(const a of ['界'.repeat(1024),'😀'.repeat(512),'\u0000'.repeat(1024)]){
  const operation=boolean('occ','join',{a}),state=append(initial(),operation),entry=state.entries[0],text=JSON.stringify(entry.operation);
  assert.equal(entry.byteSize,256+Math.max(2*text.length,new TextEncoder().encode(text).length));
  assert.deepEqual(Object.keys(entry).sort(),['byteSize','featureId','index','kind','operation','previousFeatureId']);
  assert.equal(travel(state,'undo',operation).next.cursor,0);
 }
});
