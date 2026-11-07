import assert from 'node:assert/strict';
import {MWorkerSolid} from 'review-model';
import {captureSolidMetrics} from 'review-metrics';
import {evaluateWorkerSolid} from 'review-ledger';
import {createEvaluationResourcePool} from 'review-resources';
const runtime=Object.freeze({jsSha256:'a'.repeat(64),wasmSha256:'b'.repeat(64)}),triangle=[0,0,0,1,0,0,0,1,0],bounds={min:[0,0,0],max:[1,1,1]};
const evidence=(extra={})=>({resultKind:'multi-material',materialRegions:2,voidRegions:1,validLevel0:true,validLevel2:true,manifoldPredicate:true,volume:1,volumeQuality:'native-relative-0.001',bounds,...extra});
export function legacyProbe(){const proof=evidence();delete proof.resultKind;const metrics=captureSolidMetrics('smlib',proof,1,runtime);try{const model=new MWorkerSolid(99,'smlib',new Float64Array(triangle),runtime,metrics);return {scope:'Controlled captured legacy evidence/model only; not current raw adapter runtime',resultKind:metrics.resultKind,materialRegions:metrics.materialRegions,voidRegions:metrics.voidRegions,previewAvailable:model.hasDisplayProjection(),refused:false};}catch(error){return {scope:'Controlled captured legacy evidence/model only; not current raw adapter runtime',resultKind:metrics.resultKind,materialRegions:metrics.materialRegions,voidRegions:metrics.voidRegions,refused:true,message:error.message};}}
export async function controls(){
 const records:any[]=[],metrics=captureSolidMetrics('smlib',evidence(),1,runtime);
 const zero=new ArrayBuffer(0),model=new MWorkerSolid(1,'smlib',{displayBuffer:zero,displayStatus:'unavailable',displayReason:'material-orientation-unqualified'},runtime,metrics);
 assert.equal(model.hasDisplayProjection(),false);assert.equal(model.copyDisplayPositions().length,0);assert.equal(model.inspectKernelMetrics(),metrics);assert.equal(model.inspectDisplayProjection().sourceTriangleCount,1);assert.equal(model.inspectDisplayProjection().renderTriangleCount,0);assert.throws(()=>new Uint8Array(zero),TypeError);records.push({id:'qualified-reason-zero-preview-private-custody',status:'pass'});
 for(const [id,projection]of [
  ['legacy-Float64-rejected',new Float64Array(triangle)],
  ['available-preview-rejected',{displayBuffer:new Float32Array(triangle).buffer,displayStatus:'available',displayReason:null}],
  ['precision-reason-cannot-replace-orientation',{displayBuffer:new ArrayBuffer(0),displayStatus:'unavailable',displayReason:'float32-overflow'}],
  ['nonzero-unavailable-buffer-rejected',{displayBuffer:new Float32Array(triangle).buffer,displayStatus:'unavailable',displayReason:'material-orientation-unqualified'}]
 ]as any){assert.throws(()=>new MWorkerSolid(2,'smlib',projection,runtime,metrics));records.push({id,status:'pass'});}
 for(const [id,engine,proof]of [
  ['single-material-reason-refused','smlib',evidence({resultKind:'single-material',materialRegions:1})],
  ['no-void-reason-refused','smlib',evidence({voidRegions:0})],
  ['OCC-reason-refused','occ',{resultKind:'single-solid',solidCount:1,nativeValidity:{method:'occ-inspect-analytic-v1',valid:true},triangles:1,signedVolume:1,bounds,volumeQuality:'tessellation-signed-integral'}],
  ['Manifold-reason-refused','manifold',{resultKind:'mesh-container',meshComponents:1,nativeStatus:'NoError',triangles:1,volume:1,bounds,volumeQuality:'mesh-kernel-volume'}]
 ]as any){const m=captureSolidMetrics(engine,proof,1,runtime);assert.throws(()=>new MWorkerSolid(3,engine,{displayBuffer:new ArrayBuffer(0),displayStatus:'unavailable',displayReason:'material-orientation-unqualified'},runtime,m));records.push({id,status:'pass'});}
 // A source-level legacy boundary probe, not a claim that the current pinned
 // raw mount emits this record. Legacy parser retains unknown classification.
 const legacyEvidence=evidence();delete legacyEvidence.resultKind;
 const legacy=captureSolidMetrics('smlib',legacyEvidence,1,runtime);
 assert.equal(legacy.resultKind,'unclassified-nonempty');assert.throws(()=>new MWorkerSolid(4,'smlib',new Float64Array(triangle),runtime,legacy),/orientation is unqualified/);
 records.push({id:'legacy-unclassified-known-two-material-one-void',status:'pass',resultKind:legacy.resultKind,materialRegions:legacy.materialRegions,voidRegions:legacy.voidRegions,refused:true,scope:'Captured-metrics/model source boundary only; current raw mount separately requires explicit classified evidence'});
 for(const format of ['hidden','available','legacy-classified','legacy-unclassified']){
  const owner=createEvaluationResourcePool().begin({signal:new AbortController().signal,valid:()=>true}),models=new Map(),native=new Map(),calls:any[]=[],registry={find:id=>models.get(id)};let step='single',next=0,closed=0;
  const mount={descriptor:{engine:'smlib-wasm',representation:'smlib-brep-worker-owned',runtimeAssets:runtime},ready:Promise.resolve(),async execute(message){const handle=Object.freeze({n:++next}),proof=step==='single'?evidence({resultKind:'single-material',materialRegions:1,voidRegions:0}):evidence();if(step!=='single'&&format==='legacy-unclassified')delete proof.resultKind;native.set(handle,proof);calls.push(message);return {contractVersion:1,op:message.op,handle,evidence:proof};},assertSolidBinding(handle){if(!native.has(handle))throw Error('Unbound native handle');},async readSolidMesh(message){const compound=step!=='single',modern=!compound||!format.startsWith('legacy'),hidden=compound&&format==='hidden';return {contractVersion:1,op:'solid.mesh.read',unit:'millimeter',quality:'display-only',triangleCount:1,buffer:new Float64Array(triangle).buffer,evidence:native.get(message.handle),...(modern?{displayBuffer:hidden?new ArrayBuffer(0):new Float32Array(triangle).buffer,displayStatus:hidden?'unavailable':'available',displayReason:hidden?'material-orientation-unqualified':null}:{})};},close(){closed++;native.clear();}};
  const run=async(kind,request)=>{const result=await evaluateWorkerSolid({owner,kind,request,registry,createMount:()=>mount,validateMount:()=>{},createModel:(id,engine,data,runtime,metrics)=>new MWorkerSolid(id,engine,data,runtime,metrics),valid:()=>true});for(const old of result.consumed)models.delete(old.id);models.set(result.model.id,result.model);return result;};
  const revision='sha256:'+runtime.jsSha256+':'+runtime.wasmSha256,box=id=>({version:1,unit:'millimeter',engine:'smlib',engineRevision:revision,featureId:id,origin:[id,0,0],dimensions:[1,1,1]}),boolean=(id,a,b)=>({version:1,unit:'millimeter',engine:'smlib',engineRevision:revision,featureId:id,kind:'union',a:a.model.id,b:b.model.id});
  try{
   const a=await run('box',box(10)),b=await run('box',box(11));step='compound';
   if(format==='hidden'){
    const compound=await run('boolean',boolean(12,a,b));assert.equal(compound.model.hasDisplayProjection(),false);assert.equal(compound.model.inspectKernelMetrics().voidRegions,1);assert.doesNotThrow(compound.publicationCheck);
    step='single';const c=await run('box',box(13));await run('boolean',boolean(14,compound,c));assert.equal(calls.at(-1).a.n,3,'Unqualified preview retained authenticated whole native operand');records.push({id:'ledger-hidden-result-downstream-native-handle',status:'pass'});
   }else{await assert.rejects(run('boolean',boolean(12,a,b)),error=>error.code==='ENGINE_FAILURE'&&/orientation is unqualified/.test(error.message));assert.equal(closed,1);assert.deepEqual([...models.keys()],[a.model.id,b.model.id]);records.push({id:'ledger-'+format+'-refused',status:'pass',ownerClosed:true,noOutputPublished:true});}
  }finally{owner.close();}
 }
 return {scope:'Source-controlled real capture/model/ledger with controlled provider records; no actual kernel/browser/signed transport qualification',records};
}
