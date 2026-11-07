import assert from 'node:assert/strict';
import {MWorkerSolid} from '../../web/app/cad/model/mworkerSolid';
import {MWorkerEmpty} from '../../web/app/cad/model/mworkerEmpty';
import {MShell} from '../../web/app/cad/model/mshell';
import {captureSolidMetrics} from '../../modules/engine/solid/solidMetrics.mjs';
import {evaluateWorkerSolid} from '../../modules/engine/solid/solidLedger.mjs';
import {createEvaluationResourcePool} from '../../web/app/cad/craft/evaluationResources.mjs';
import {createWorkerSolidCommands} from '../../web/app/cad/craft/workerSolidCommands';
const runtime=Object.freeze({jsSha256:'a'.repeat(64),wasmSha256:'b'.repeat(64)}),revision='sha256:'+runtime.jsSha256+':'+runtime.wasmSha256;
const bounds={min:[0,0,0],max:[1,1,1]},evidence=(kind='single-material')=>({resultKind:kind,materialRegions:kind==='empty'?0:kind==='multi-material'?2:1,voidRegions:0,validLevel0:true,validLevel2:kind==='empty'?null:true,manifoldPredicate:kind==='empty'?null:true,volume:kind==='empty'?0:1,volumeQuality:kind==='empty'?'empty':'native-relative-0.001',bounds:kind==='empty'?null:bounds});
const triangle=[0,0,0,1,0,0,0,1,0];
export async function controls(){
 const metrics=captureSolidMetrics('smlib',evidence('multi-material'),513,runtime),display=new Float32Array(513*9);for(let i=0;i<513;i++)display.set(triangle,i*9);
 const originalBuffer=display.buffer,realHypot=Math.hypot;let large:MWorkerSolid;
 Math.hypot=()=>{throw Error('Unexpected main-thread triangle validation');};
 try{large=new MWorkerSolid(100,'smlib',{displayBuffer:originalBuffer,displayStatus:'available',displayReason:null},runtime,metrics);}finally{Math.hypot=realHypot;}
 assert.equal(originalBuffer.byteLength,0);assert.equal(large.copyDisplayPositions().length,513*9);const publicCopy=large.copyDisplayPositions();publicCopy[0]=123;assert.equal(large.copyDisplayPositions()[0],0);
 const hidden=new MWorkerSolid(101,'smlib',{displayBuffer:new ArrayBuffer(0),displayStatus:'unavailable',displayReason:'float32-collapsed-triangle'},runtime,metrics);
 assert.ok(hidden instanceof MShell);assert.equal(hidden.hasDisplayProjection(),false);assert.equal(hidden.copyDisplayPositions().length,0);assert.equal(hidden.inspectDisplayProjection().sourceTriangleCount,513);
 const controller=new AbortController(),owner=createEvaluationResourcePool().begin({signal:controller.signal,valid:()=>true}),map=new Map(),registry:any={models:[],shells:[],find:id=>map.get(id)},native=new Map(),calls:any[]=[];let nextKind='single-material',nextVoids=0,next=0,closed=0;
 const mount={descriptor:{engine:'smlib-wasm',representation:'smlib-brep-worker-owned',runtimeAssets:runtime},ready:Promise.resolve(),async execute(message){const handle=Object.freeze({token:++next}),proof={...evidence(nextKind),voidRegions:nextVoids};native.set(handle,proof);calls.push(message);return {contractVersion:1,op:message.op,handle,evidence:proof};},assertSolidBinding(handle){if(!native.has(handle))throw Error('Unbound');},async readSolidMesh(message){const proof=native.get(message.handle),empty=proof.resultKind==='empty',data=new Float64Array(empty?[]:triangle),hidden=proof.materialRegions>1&&proof.voidRegions>0,displayData=new Float32Array(empty||hidden?[]:triangle);return {contractVersion:1,op:'solid.mesh.read',unit:'millimeter',quality:'display-only',triangleCount:empty?0:1,evidence:proof,buffer:data.buffer,displayBuffer:displayData.buffer,displayStatus:hidden?'unavailable':'available',displayReason:hidden?'material-orientation-unqualified':null};},close(){closed++;native.clear();}};
 const run=async(kind,request)=>{const result=await evaluateWorkerSolid({owner,kind,request,registry,createMount:()=>mount,validateMount:()=>{},createModel:(id,engine,data,provenance,m)=>new MWorkerSolid(id,engine,data,provenance,m),createEmptyModel:(id,engine,provenance,m)=>new MWorkerEmpty(id,engine,provenance,m),valid:()=>true});for(const old of result.consumed)map.delete(old.id);map.set(result.model.id,result.model);registry.models=[...map.values()];registry.shells=registry.models.filter(x=>x instanceof MShell);return result;};
 const box=id=>({version:1,unit:'millimeter',engine:'smlib',engineRevision:revision,featureId:id,origin:[id,0,0],dimensions:[1,1,1]}),boolean=(id,kind,a,b)=>({version:1,unit:'millimeter',engine:'smlib',engineRevision:revision,featureId:id,kind,a:a.model.id,b:b.model.id});
 const a=await run('box',box(1)),b=await run('box',box(2));nextKind='empty';const empty=await run('boolean',boolean(3,'common',a,b));
 assert.ok(empty.model instanceof MWorkerEmpty);assert.equal(empty.model instanceof MShell,false);assert.equal(registry.shells.length,0);assert.doesNotThrow(empty.publicationCheck);
 const ctx:any={craftService:{inspectRectangleCreation:()=>({ready:true,reason:null,revision:'current'})},cadRegistry:registry,projectService:{}},commands=createWorkerSolidCommands(ctx,()=>{},()=>{},()=>[]),inspected=commands.inspectWorkerSolids();
 assert.equal(inspected.bodies.length,0);assert.equal(inspected.outputs.length,1);assert.equal(inspected.outputs[0].bodyId,null);assert.equal(inspected.outputs[0].outputId,empty.model.id);
 nextKind='single-material';const c=await run('box',box(4)),restored=await run('boolean',boolean(5,'union',empty,c));assert.ok(restored.model instanceof MWorkerSolid);assert.equal(calls.at(-1).a.token,3,'Empty native handle remained authenticated as an operand');
 const d=await run('box',box(6));nextKind='multi-material';const compound=await run('boolean',boolean(7,'union',restored,d));const output=commands.inspectWorkerSolids();
 assert.equal(output.bodies.length,1);assert.equal(output.outputs.length,1);assert.equal(output.outputs[0].resultKind,'multi-material');assert.equal(output.outputs[0].metrics.materialRegions,2);assert.equal(output.outputs[0].bodyId,compound.model.id);

 nextKind='single-material';const e=await run('box',box(8));nextKind='multi-material';nextVoids=1;
 const cavityCompound=await run('boolean',boolean(9,'union',compound,e));
 assert.equal(cavityCompound.model.hasDisplayProjection(),false);
 assert.equal(cavityCompound.model.inspectDisplayProjection().reason,'material-orientation-unqualified');
 assert.equal(cavityCompound.model.inspectKernelMetrics().voidRegions,1);
 assert.equal(cavityCompound.model.copyDisplayPositions().length,0);
 assert.doesNotThrow(cavityCompound.publicationCheck);
 const cavityMetrics=cavityCompound.model.inspectKernelMetrics();
 assert.throws(()=>new MWorkerSolid(102,'smlib',{displayBuffer:new Float32Array(triangle).buffer,displayStatus:'available',displayReason:null},cavityMetrics.runtime,cavityMetrics),/orientation is unqualified/);
 assert.throws(()=>new MWorkerSolid(103,'smlib',{displayBuffer:new ArrayBuffer(0),displayStatus:'unavailable',displayReason:'material-orientation-unqualified'},runtime,metrics),/does not match/);

 const legacyProof:any={...evidence('multi-material'),voidRegions:1};delete legacyProof.resultKind;
 const legacyMetrics=captureSolidMetrics('smlib',legacyProof,1,runtime);
 assert.equal(legacyMetrics.resultKind,'unclassified-nonempty');
 assert.throws(()=>new MWorkerSolid(104,'smlib',new Float64Array(triangle),runtime,legacyMetrics),/orientation is unqualified/);
 owner.close();assert.equal(closed,1);
 return {scope:'Source-controlled real model/ledger/inspection with controlled provider records; not actual kernel/browser qualification',emptyIsMetadata:true,emptyOperandRetainsPrivateHandle:true,wholeCompoundOutput:true,modernAbove512CustodyTransferred:true,unavailableDisplayRetainsNonempty:true,multiMaterialVoidRetainsWholeHandleWithoutPreview:true};
}
