// Admission refusals only. Manual ephemeral inputs are not sketch authoring,
// solved geometry, a native result, or an accepted CAD feature.
import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateWorkerSolid} from '../../modules/engine/solid/solidLedger.mjs';
const revision='sha256:567419c13c78fff46cbc9cd07e5a993106b652a13cb9f6944831f68ef48729cc:ad9475c81ea2eecadd41c73f0b0860d7d06c53e4292b16047472f03995f3efdd';
function request(){
 const points=[[1,0],[3,0],[3,4],[1,4]];
 return {version:1,unit:'millimeter',engine:'occ',engineRevision:revision,featureId:41,revolve:{op:'solid.profile.revolve',version:1,unit:'millimeter',source:{faceId:'face:source',sourceSha256:'a'.repeat(64)},frame:{origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]},region:{id:'region:ephemeral',outer:points.map((a,i)=>({kind:'segment',id:'edge'+i,a,b:points[(i+1)%4]})),holes:[]},axis:{kind:'source-segment',id:'source:axis',a:[0,0],b:[0,4]},angleRadians:Math.PI}};
}
const binding=()=>({featureId:41,faceId:'face:source',regionId:'region:ephemeral',axisSegmentId:'source:axis'});
function fixture(){
 const signal=new AbortController().signal,face={},counts={mounts:0,executions:0,closed:0};
 const owner={state:'candidate',signal,requireCurrent(){},getOrCreateMount(_key,create){return create();},close(){counts.closed++;}};
 return {counts,input:{owner,kind:'revolve',request:request(),registry:{find(){return null;},findFace(id){return id==='face:source'?face:null;}},createMount(){counts.mounts++;throw Error('Native allocation must not be reached');},validateMount(){},createModel(){throw Error('No synthetic model result');},valid:()=>true}};
}
for(const [label,patch] of [['missing binding',()=>undefined],['wrong feature',()=>({...binding(),featureId:42})],['wrong source',()=>({...binding(),faceId:'face:other'})],['wrong region',()=>({...binding(),regionId:'region:other'})],['wrong axis',()=>({...binding(),axisSegmentId:'axis:other'})]])test('revolve ledger rejects '+label+' before allocation',async()=>{
 const f=fixture();f.input.sourceBinding=patch();await assert.rejects(evaluateWorkerSolid(f.input),{code:'STALE_SOURCE'});assert.equal(f.counts.mounts,0);assert.equal(f.counts.closed,0);
});
test('source binding accessors are refused without execution',async()=>{
 const f=fixture();let calls=0;const supplied=binding();Object.defineProperty(supplied,'axisSegmentId',{enumerable:true,get(){calls++;return 'source:axis';}});f.input.sourceBinding=supplied;await assert.rejects(evaluateWorkerSolid(f.input),{code:'INVALID_REQUEST'});assert.equal(calls,0);assert.equal(f.counts.mounts,0);
});
test('a mount without revolve capability refuses before posting or publication',async()=>{
 const f=fixture();f.input.sourceBinding=binding();f.input.createMount=()=>{f.counts.mounts++;return {descriptor:{operations:[{id:'solid.profile.extrude',version:3}]},execute(){f.counts.executions++;throw Error('No post expected');}};};await assert.rejects(evaluateWorkerSolid(f.input),{code:'ENGINE_CAPABILITY_UNAVAILABLE'});assert.equal(f.counts.mounts,1);assert.equal(f.counts.executions,0);assert.equal(f.counts.closed,1);
});
