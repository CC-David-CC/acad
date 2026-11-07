// Admission-only controls: manual ephemeral data is not a solved-source or
// geometry oracle. These tests never manufacture native-success/model replies.
import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateWorkerSolid} from '../../modules/engine/solid/solidLedger.mjs';
const revision='sha256:'+'a'.repeat(64)+':'+'b'.repeat(64);
function section(faceId,z,radius){return{source:{faceId,sourceSha256:'a'.repeat(64)},frame:{origin:[0,0,z],x:[1,0,0],y:[0,1,0],z:[0,0,1]},region:{id:'sketch-region:'+faceId,outer:[{kind:'circle',id:faceId+'/circle:'+faceId,center:[0,0],radius}],holes:[]}};}
function binding(){return{featureId:4,sections:['a','b'].map(faceId=>({faceId,regionId:'sketch-region:'+faceId,seam:{kind:'circle-angle',curveId:'circle:'+faceId,angleRadians:0,reversed:false}}))};}
function fixture(){const faces={a:{},b:{}},counts={mounts:0,posts:0,closed:0},owner={state:'candidate',signal:new AbortController().signal,requireCurrent(){},getOrCreateMount(_key,create){return create();},close(){counts.closed++;}};return{faces,counts,input:{owner,kind:'loft',request:{version:1,unit:'millimeter',engine:'occ',engineRevision:revision,featureId:4,loft:{op:'solid.profile.loft',version:1,unit:'millimeter',sections:[section('a',0,2),section('b',10,3)],correspondence:{kind:'circle',startA:0,reverseA:false,startB:0,reverseB:false},construction:'ruled-solid'}},sourceBinding:binding(),registry:{find(){return null;},findFace(id){return faces[id]||null;}},createMount(){counts.mounts++;throw Error('Native allocation must not occur');},validateMount(){},createModel(){throw Error('No synthetic geometry');},valid:()=>true}};}
for(const[label,patch]of[
 ['missing',()=>undefined],['feature',b=>({...b,featureId:5})],
 ['first source',b=>({...b,sections:[{...b.sections[0],faceId:'removed'},b.sections[1]]})],
 ['second source',b=>({...b,sections:[b.sections[0],{...b.sections[1],faceId:'removed'}]})],
 ['region',b=>({...b,sections:[b.sections[0],{...b.sections[1],regionId:'sketch-region:other'}]})],
 ['curve',b=>({...b,sections:[b.sections[0],{...b.sections[1],seam:{...b.sections[1].seam,curveId:'other'}}]})],
 ['angle',b=>({...b,sections:[b.sections[0],{...b.sections[1],seam:{...b.sections[1].seam,angleRadians:1}}]})],
 ['direction',b=>({...b,sections:[b.sections[0],{...b.sections[1],seam:{...b.sections[1].seam,reversed:true}}]})],
 ['section order',b=>({...b,sections:[...b.sections].reverse()})]
])test('loft refuses stale '+label+' before allocation',async()=>{const f=fixture();f.input.sourceBinding=patch(binding());await assert.rejects(evaluateWorkerSolid(f.input),{code:'STALE_SOURCE'});assert.equal(f.counts.mounts,0);assert.equal(f.counts.closed,0);});
test('loft refuses an actually missing second source before allocation',async()=>{const f=fixture();delete f.faces.b;await assert.rejects(evaluateWorkerSolid(f.input),{code:'STALE_SOURCE'});assert.equal(f.counts.mounts,0);});
test('loft refuses accessor binding without invoking it',async()=>{const f=fixture();let calls=0;Object.defineProperty(f.input.sourceBinding,'sections',{enumerable:true,get(){calls++;throw Error('Getter must not execute');}});await assert.rejects(evaluateWorkerSolid(f.input),{code:'INVALID_REQUEST'});assert.equal(calls,0);assert.equal(f.counts.mounts,0);});
test('loft refuses native dispatch without declared loft capability',async()=>{const f=fixture();f.input.createMount=()=>{f.counts.mounts++;return{descriptor:{operations:[{id:'solid.profile.sweep',version:1}]},execute(){f.counts.posts++;throw Error('No post');}};};await assert.rejects(evaluateWorkerSolid(f.input),{code:'ENGINE_CAPABILITY_UNAVAILABLE'});assert.equal(f.counts.mounts,1);assert.equal(f.counts.posts,0);assert.equal(f.counts.closed,1);});
