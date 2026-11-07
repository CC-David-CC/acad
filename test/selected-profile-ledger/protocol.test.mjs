// Ownership/protocol controls: test mount + projection, not native geometry,
// real Worker, CAD application, source solver or persistence qualification.
import test from 'node:test';import assert from 'node:assert/strict';
import {captureSolidProfile,solidBodyId} from '../../modules/engine/solid/solidIntent.mjs';
import {captureSolidMetrics} from '../../modules/engine/solid/solidMetrics.mjs';
import {evaluateWorkerSolid,inspectWorkerSolidSelections} from '../../modules/engine/solid/solidLedger.mjs';
import {createEvaluationResourcePool} from '../../web/app/cad/craft/evaluationResources.mjs';
const revision='sha256:'+'a'.repeat(64)+':'+'b'.repeat(64),otherRevision='sha256:'+'c'.repeat(64)+':'+'b'.repeat(64),runtime=Object.freeze({jsSha256:'a'.repeat(64),wasmSha256:'b'.repeat(64)});
const bounds=()=>({min:[-2,-2,0],max:[2,2,5]});
const profile=()=>({op:'solid.profile.extrude',version:2,unit:'millimeter',frame:{origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]},depth:5,region:{id:'region-1',outer:[{kind:'circle',id:'c',center:[0,0],radius:2}],holes:[]}});
const intent=(featureId=1)=>({version:1,unit:'millimeter',engine:'occ',engineRevision:revision,featureId,profile:profile()});
const evidence=()=>({resultKind:'single-solid',solidCount:1,nativeValidity:{method:'occ-inspect-analytic-v1',valid:true},signedVolume:60,triangles:1,bounds:bounds(),volumeQuality:'tessellation-signed-integral',nativeVolume:20*Math.PI,nativeBounds:bounds()});
function projection(featureId,engine,positions,runtime,metrics){const display=Object.freeze({status:'available',reason:null,sourceTriangleCount:metrics.triangleCount,renderTriangleCount:metrics.triangleCount});return{featureId,id:solidBodyId(featureId),ext:{workerGeometry:Object.freeze({engine,runtime,resultKind:metrics.resultKind})},csys:{origin:{x:0,y:0,z:0},x:{x:1,y:0,z:0},y:{x:0,y:1,z:0},z:{x:0,y:0,z:1}},location$:{value:{mxx:1,mxy:0,mxz:0,tx:0,myx:0,myy:1,myz:0,ty:0,mzx:0,mzy:0,mzz:1,tz:0}},faces:[],edges:[],vertices:[],hasDisplayProjection:()=>true,inspectDisplayProjection:()=>display,inspectKernelMetrics:()=>metrics};}
function fixture(){
 const controller=new AbortController(),owner=createEvaluationResourcePool().begin({signal:controller.signal,valid:()=>true}),objects=new Map(),source={id:'source-plane'},handles=new Set(),calls=[],factories=[],validations=[];objects.set(source.id,source);let next=0,closes=0,models=0,current=true,makeEvidence=evidence;
 const mount={descriptor:Object.freeze({engine:'test-occ',representation:'occ-brep-worker-owned',runtimeAssets:runtime}),ready:Promise.resolve(),async execute(request){calls.push(request);const handle=Object.freeze({id:++next});handles.add(handle);return{op:request.op,contractVersion:1,handle};},async readSolidMesh(request){return{op:request.op,contractVersion:1,unit:'millimeter',quality:'display-only',triangleCount:1,buffer:new Float64Array([0,0,0,1,0,0,0,1,0]).buffer,displayBuffer:new Float32Array([0,0,0,1,0,0,0,1,0]).buffer,displayStatus:'available',displayReason:null,evidence:makeEvidence()};},assertSolidBinding(handle){if(!handles.has(handle))throw Error('Invalid test handle');return true;},close(){closes++;handles.clear();}};
 const registry={find:id=>objects.get(id)},createMount=(engine,rev)=>{factories.push([engine,rev]);return mount;},run=(kind,request)=>evaluateWorkerSolid({owner,kind,request,registry,createMount,validateMount:(engine,m,rev)=>{assert.equal(engine,'occ');assert.equal(m,mount);validations.push(rev);},createModel:(...args)=>{models++;return projection(...args);},valid:()=>current});
 return{controller,owner,objects,source,calls,factories,validations,mount,run,setEvidence(fn){makeEvidence=fn;},setCurrent(value){current=value;},get closes(){return closes;},get models(){return models;}};
}
const rejects=(p,code)=>assert.rejects(p,e=>{assert.equal(e.code,code);return true;});
test('profile captures strict nested data and freezes detached ephemeral geometry',()=>{
 const request=intent(),captured=captureSolidProfile(request);request.profile.frame.origin[0]=9;request.profile.region.outer[0].radius=10;assert.equal(captured.profile.frame.origin[0],0);assert.equal(captured.profile.region.outer[0].radius,2);assert(Object.isFrozen(captured.profile.region.outer[0]));
 for(const bad of [{...intent(),handle:'native'},{...intent(),version:2},{...intent(),engine:'smlib'},{...intent(),engineRevision:'latest'},{...intent(),profile:{...profile(),version:1}}])assert.throws(()=>captureSolidProfile(bad));
 let calls=0;const accessor=intent();Object.defineProperty(accessor.profile.region.outer[0],'radius',{enumerable:true,get(){calls++;return 2;}});assert.throws(()=>captureSolidProfile(accessor));assert.equal(calls,0);const extra=intent();extra.profile.region.outer[0].unexpected=true;assert.throws(()=>captureSolidProfile(extra));
});
test('v2 dispatch creates one generic output, forwards revision and preserves source',async()=>{
 const f=fixture();try{const request=intent(),out=await f.run('profile',request);assert.deepEqual(f.calls,[request.profile]);assert.deepEqual(f.factories,[['occ',revision]]);assert.deepEqual(f.validations,[revision]);assert.deepEqual(out.consumed,[]);assert.equal(out.outputId,solidBodyId(1));assert.equal(f.objects.get(f.source.id),f.source);assert.equal(f.models,1);assert.equal(out.model.faces.length,0);assert.equal(out.model.inspectKernelMetrics().nativeVolume,20*Math.PI);assert.equal(out.model.inspectKernelMetrics().reportedVolume,60);assert.doesNotThrow(out.publicationCheck);}finally{f.owner.close();}assert.equal(f.closes,1);
});
test('same runtime reuses mount; changed same-engine revision refuses before factory/job',async()=>{
 const f=fixture();try{const a=await f.run('profile',intent(1)),b=await f.run('profile',intent(2));f.objects.set(a.model.id,a.model);f.objects.set(b.model.id,b.model);await rejects(f.run('profile',{...intent(3),engineRevision:otherRevision}),'ENGINE_REVISION_MISMATCH');assert.equal(f.calls.length,2);assert.equal(f.factories.length,1);assert.equal(f.closes,0);assert.doesNotThrow(a.publicationCheck);assert.doesNotThrow(b.publicationCheck);}finally{f.owner.close();}
});
test('profile outputs use same-runtime Boolean ownership without consuming source',async()=>{
 const f=fixture();try{const a=await f.run('profile',intent(1)),b=await f.run('profile',intent(2));f.objects.set(a.model.id,a.model);f.objects.set(b.model.id,b.model);const out=await f.run('boolean',{version:1,unit:'millimeter',engine:'occ',engineRevision:revision,featureId:3,kind:'union',a:a.model.id,b:b.model.id});assert.deepEqual(out.consumed,[a.model,b.model]);assert.equal(f.calls[2].op,'solid.boolean.union');assert.equal(f.factories.length,1);assert.equal(f.objects.get(f.source.id),f.source);assert.equal(JSON.stringify(out.model.ext).includes('"handle"'),false);}finally{f.owner.close();}
});
test('profile is detached before mount readiness suspension',async()=>{
 const f=fixture();let release;f.mount.ready=new Promise(resolve=>release=resolve);const request=intent(),pending=f.run('profile',request);request.profile.region.outer[0].radius=99;request.profile.frame.origin[0]=123;release();try{await pending;assert.equal(f.calls[0].region.outer[0].radius,2);assert.deepEqual(f.calls[0].frame.origin,[0,0,0]);}finally{f.owner.close();}
});
test('wrong persisted mount revision refuses before dispatch and closes owner',async()=>{
 const f=fixture();await rejects(f.run('profile',{...intent(),engineRevision:otherRevision}),'ENGINE_REVISION_MISMATCH');assert.equal(f.calls.length,0);assert.equal(f.models,0);assert.equal(f.closes,1);assert.equal(f.owner.state,'closed');
});
test('cancelled held protocol completion cannot project or mutate source',async()=>{
 const f=fixture();let deliver,entered;const started=new Promise(resolve=>entered=resolve);f.mount.execute=request=>new Promise(resolve=>{entered();deliver=()=>resolve({op:request.op,contractVersion:1,handle:{id:1}});});const pending=f.run('profile',intent());await started;f.controller.abort();deliver();await assert.rejects(pending,{name:'AbortError'});assert.equal(f.models,0);assert.equal(f.closes,1);assert.equal(f.objects.size,1);assert.equal(f.objects.get(f.source.id),f.source);
});
test('stale completion and post-acceptance ownership check refuse',async()=>{
 const f=fixture();try{const out=await f.run('profile',intent());f.setCurrent(false);assert.throws(out.publicationCheck,{name:'AbortError'});}finally{f.owner.close();}
 const g=fixture();g.mount.readSolidMesh=async()=>{g.setCurrent(false);return {};};await assert.rejects(g.run('profile',intent()),{name:'AbortError'});assert.equal(g.models,0);assert.equal(g.closes,1);
});
test('missing native facts, multisolids, invalid/zero facts and malformed mesh refuse',async()=>{
 const changes=[e=>delete e.nativeVolume,e=>delete e.nativeBounds,e=>{e.resultKind='multi-solid';e.solidCount=2;},e=>e.nativeValidity.valid=false,e=>e.nativeVolume=0,e=>e.nativeBounds.max[0]=-3];
 for(const change of changes){const f=fixture();f.setEvidence(()=>{const e=evidence();change(e);return e;});await rejects(f.run('profile',intent()),'ENGINE_FAILURE');assert.equal(f.models,0);assert.equal(f.closes,1);assert.equal(f.objects.get(f.source.id),f.source);}
 const f=fixture();f.mount.readSolidMesh=async()=>({contractVersion:1,op:'solid.mesh.read',unit:'millimeter',quality:'display-only',triangleCount:1,buffer:new ArrayBuffer(0)});await rejects(f.run('profile',intent()),'ENGINE_FAILURE');assert.equal(f.models,0);
});
test('positive selected region cannot publish an otherwise valid empty result',async()=>{
 const f=fixture();f.mount.readSolidMesh=async()=>({contractVersion:1,op:'solid.mesh.read',unit:'millimeter',quality:'display-only',triangleCount:0,buffer:new ArrayBuffer(0),displayBuffer:new ArrayBuffer(0),displayStatus:'available',displayReason:null,evidence:{resultKind:'empty',solidCount:0,nativeValidity:{method:'occ-inspect-analytic-v1',valid:true},signedVolume:0,triangles:0,bounds:null,volumeQuality:'tessellation-signed-integral',nativeVolume:0,nativeBounds:null}});
 await rejects(f.run('profile',intent()),'ENGINE_FAILURE');assert.equal(f.models,0);assert.equal(f.closes,1);assert.equal(f.objects.get(f.source.id),f.source);
});
test('native measurements are detached and never replace mesh observations or absent old facts',()=>{
 const e=evidence(),m=captureSolidMetrics('occ',e,1,runtime);e.nativeBounds.min[0]=999;e.nativeVolume=99;assert.equal(m.nativeVolume,20*Math.PI);assert.equal(m.reportedVolume,60);assert.equal(m.volumeKind,'occ-tessellation-signed-volume');assert.equal(m.boundsKind,'tessellation');assert.equal(m.nativeMeasurementQuality,'provider-native-unqualified');assert.equal(m.nativeBounds.min[0],-2);assert(Object.isFrozen(m.nativeBounds.min));
 const old=evidence();delete old.nativeVolume;delete old.nativeBounds;const absent=captureSolidMetrics('occ',old,1,runtime);assert.equal(absent.nativeVolume,null);assert.equal(absent.nativeBounds,null);assert.equal(absent.nativeMeasurementQuality,null);
});
test('native pair/key/dense/finite/accessor checks refuse without getter invocation',()=>{
 const changes=[e=>e.nativeVolume=NaN,e=>e.nativeVolume=-1,e=>delete e.nativeBounds,e=>e.nativeBounds.extra=1,e=>e.nativeBounds[Symbol('extra')]=1,e=>delete e.nativeBounds.min[0],e=>e.nativeBounds.max[0]=Infinity];
 for(const change of changes){const e=evidence();change(e);assert.throws(()=>captureSolidMetrics('occ',e,1,runtime),{code:'ENGINE_FAILURE'});}
 let called=0;const e=evidence();Object.defineProperty(e,'nativeVolume',{enumerable:true,get(){called++;return 1;}});assert.throws(()=>captureSolidMetrics('occ',e,1,runtime),{code:'ENGINE_FAILURE'});assert.equal(called,0);const b=evidence();Object.defineProperty(b.nativeBounds.min,'0',{enumerable:true,get(){called++;return -2;}});assert.throws(()=>captureSolidMetrics('occ',b,1,runtime),{code:'ENGINE_FAILURE'});assert.equal(called,0);
});

// V3 protocol snapshots are routing/ownership tests, not a native feature pass.
test('V3 selection observation receives the producer identity and publishes immutable semantic metadata only',async()=>{
 const f=fixture(),execute=f.mount.execute,request=intent(17);request.profile.version=3;
 const plan={version:1,featureId:17,regionId:request.profile.region.id,scope:'authored-source',source:'prism-construction-history',edges:[{id:'authored-edge',role:'first-boundary',curveId:'c',geometry:'circle'}],faces:[],unresolved:[]};
 f.mount.execute=async r=>{if(r.op==='solid.prism.selections.read'){f.calls.push(r);return {contractVersion:1,op:r.op,unit:'millimeter',selection:{status:'available',plan:structuredClone(plan)}};}return execute(r);};
 try{const output=await f.run('profile',request),snapshot=inspectWorkerSolidSelections(output.model);assert.equal(f.calls[1].op,'solid.prism.selections.read');assert.equal(f.calls[1].featureId,17);assert.deepEqual(snapshot.plan,plan);assert.ok(Object.isFrozen(snapshot.plan.edges[0]));assert.equal(JSON.stringify(snapshot).includes('handle'),false);assert.equal(JSON.stringify(output.model.ext).includes('authored-edge'),false);assert.equal(inspectWorkerSolidSelections({}).status,'unavailable');}finally{f.owner.close();}
});
test('V3 rejects wrong producer binding or cancelled selection observation without projecting output',async()=>{
 for(const wrong of [true,false]){const f=fixture(),execute=f.mount.execute,request=intent(17);request.profile.version=3;
  f.mount.execute=async r=>{if(r.op==='solid.prism.selections.read'){if(!wrong)f.controller.abort();return {contractVersion:1,op:r.op,unit:'millimeter',selection:{status:'available',plan:{version:1,featureId:wrong?18:17,regionId:request.profile.region.id,scope:'authored-source',edges:[],faces:[],unresolved:[]}}};}return execute(r);};
  await assert.rejects(f.run('profile',request),wrong?{code:'ENGINE_FAILURE'}:{name:'AbortError'});assert.equal(f.models,0);assert.equal(f.owner.state,'closed');
 }
});

test('edge treatment uses private current-parent custody and inherits immutable selection metadata',async()=>{
 const f=fixture(),execute=f.mount.execute;f.mount.descriptor={...f.mount.descriptor,operations:[{id:'solid.edge.treat',version:1}]};
 f.mount.execute=async request=>request.op==='solid.prism.selections.read'?{contractVersion:1,op:request.op,unit:'millimeter',selection:{status:'available',plan:{version:1,featureId:request.featureId,regionId:'region-1',scope:'authored-source',edges:[{id:'source-edge',role:'connector',geometry:'line'}],faces:[],unresolved:[]}}}:execute(request);
 try{const source=intent(1);source.profile.version=3;const parent=await f.run('profile',source);f.objects.set(parent.model.id,parent.model);
  const treatment={version:1,unit:'millimeter',engine:'occ',engineRevision:revision,featureId:2,target:parent.model.id,producerFeatureId:1,kind:'fillet',edgeIds:['source-edge'],size:3};
  const before=f.calls.length;await rejects(f.run('edge-treatment',{...treatment,edgeIds:['unknown']}),'UNRESOLVED_SELECTION');assert.equal(f.calls.length,before);
  const output=await f.run('edge-treatment',treatment),call=f.calls.at(-1);assert.equal(call.op,'solid.edge.treat');assert.equal(call.producerFeatureId,1);assert.equal(call.featureId,2);assert.deepEqual(call.edgeIds,['source-edge']);assert.equal(call.handle.id,1);assert.deepEqual(output.consumed,[parent.model]);assert.equal(inspectWorkerSolidSelections(output.model).plan.featureId,2);assert.equal(output.outputId,solidBodyId(2));assert.doesNotThrow(output.publicationCheck);assert.equal(JSON.stringify(treatment).includes('handle'),false);
 }finally{f.owner.close();}
});
