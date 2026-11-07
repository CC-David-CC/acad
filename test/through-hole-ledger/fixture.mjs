// Protocol fixture only. Geometry, Float64 coordinates, native metrics and
// selection plans come from recorded genuine through-hole Chromium observations. Handles,
// mount transport and projection are doubles, never live native resources.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {evaluateWorkerSolid,inspectWorkerSolidSelections} from '../../modules/engine/solid/solidLedger.mjs';
import {solidBodyId} from '../../modules/engine/solid/solidIntent.mjs';
import {createEvaluationResourcePool} from '../../web/app/cad/craft/evaluationResources.mjs';
import {fixtures as sources,holeIntent} from '../through-hole-browser/cases.mjs';
const raw=readFileSync(new URL('../through-hole-browser/evidence-r1/through-hole.json',import.meta.url));
const proof=JSON.parse(readFileSync(new URL('../through-hole-browser/evidence-r1/receipt.json',import.meta.url)));
assert.equal(createHash('sha256').update(raw).digest('hex'),proof.runs['through-hole'].portableSHA256);
const recording=JSON.parse(raw);assert.equal(recording.status,'PASS');
export const inputProof=Object.freeze({sha256:proof.runs['through-hole'].portableSHA256,rawSHA256:proof.runs['through-hole'].rawSHA256,componentSHA256:recording.pins.componentManifestSHA256});
export const runtime=Object.freeze({jsSha256:'dd666902fe926d69cc3c8843f5568c2a3e569f38ff49291baa2f248165b5ea99',wasmSha256:'8d5e537e0d7f9e12b8ae0eaf239c0be1080934ed12a24bf6e7f849c9135ed5a2',workerSha256:recording.pins.assets['modules/engine/mount/boolean-history-worker.js'].sha256});
export const revision=`sha256:${runtime.jsSha256}:${runtime.wasmSha256}`;
const common=featureId=>({version:1,unit:'millimeter',engine:'occ',engineRevision:revision,featureId});
export function chain(index=0){
 const source=sources[index],row=recording.actual.rows[index],steps=[{kind:'profile',intent:{...common(10),profile:source.source},sourceBinding:{featureId:10,faceId:source.sourceFaceId,regionId:source.source.region.id},observed:row.base}];
 steps.push({kind:'through-hole',intent:holeIntent(source,'centered-through'),observed:row.center});
 steps.push({kind:'through-hole',intent:holeIntent(source,'four-corner-through'),observed:row.corners});
 steps.push({kind:'edge-treatment',intent:{...common(40),target:solidBodyId(21),producerFeatureId:21,kind:'fillet',edgeIds:row.fillet.selected,size:3},observed:row.fillet});
 steps.push({kind:'edge-treatment',intent:{...common(41),target:solidBodyId(40),producerFeatureId:40,kind:'chamfer-equal',edgeIds:row.chamfer.selected,size:1},observed:row.chamfer});return{source,row,steps};
}
function projection(featureId,engine,view,provenance,metrics){
 const display=Object.freeze({status:view.displayStatus,reason:view.displayReason,sourceTriangleCount:metrics.triangleCount,renderTriangleCount:view.displayStatus==='available'?metrics.triangleCount:0});
 return{featureId,id:solidBodyId(featureId),ext:{workerGeometry:Object.freeze({engine,runtime:provenance,resultKind:metrics.resultKind})},csys:{origin:{x:0,y:0,z:0},x:{x:1,y:0,z:0},y:{x:0,y:1,z:0},z:{x:0,y:0,z:1}},location$:{value:{mxx:1,mxy:0,mxz:0,tx:0,myx:0,myy:1,myz:0,ty:0,mzx:0,mzy:0,mzz:1,tz:0}},faces:[],edges:[],vertices:[],hasDisplayProjection:()=>display.status==='available',inspectDisplayProjection:()=>display,inspectKernelMetrics:()=>metrics};
}
export function fixture(index=0,{selectionTransform}={}){
 const data=chain(index),controller=new AbortController(),owner=createEvaluationResourcePool().begin({signal:controller.signal,valid:()=>true}),objects=new Map(),handles=new Map(),calls=[],meshReads=[],projections=[],outputs=[];let sourceBinding=null,selectedStep=null,next=0,closes=0,factoryCalls=0;
 const face={id:data.source.sourceFaceId};const faces=new Map([[face.id,face]]);
 const mount={descriptor:Object.freeze({engine:'occ-boolean-history-v1-component',representation:'occ-brep-worker-owned',runtimeAssets:runtime,operations:[{id:'solid.selections.read',version:1,selectionPlanVersion:2},{id:'solid.edge.treat',version:1},{id:'solid.holes.through',version:1}]}),ready:Promise.resolve(),
  async execute(request){
   calls.push(request);
   if(request.op==='solid.selections.read'){
    const item=handles.get(request.handle);assert(item,'Unknown protocol handle');assert.equal(item.step.intent.featureId,request.featureId);
    let selection=structuredClone(item.step.observed.selection);if(selectionTransform)selection=selectionTransform(selection,item.step,request);
    return{contractVersion:1,op:request.op,unit:'millimeter',selection};
   }
   assert(selectedStep,'No recorded protocol result selected');const step=selectedStep;selectedStep=null;
   if(step.kind==='profile')assert.deepEqual(request,step.intent.profile);
   else if(step.kind==='through-hole'){assert.equal(request.op,'solid.holes.through');assert.equal(handles.get(request.handle).step.intent.featureId,step.intent.producerFeatureId);assert.equal(handles.get(request.sourceHandle).step.intent.featureId,step.intent.sourceFeatureId);const {op,handle,sourceHandle,...authored}=request;assert.deepEqual(authored,step.intent);}
   else{assert.equal(request.op,'solid.edge.treat');assert.equal(request.featureId,step.intent.featureId);assert.equal(request.producerFeatureId,step.intent.producerFeatureId);assert.equal(handles.get(request.handle).step.intent.featureId,request.producerFeatureId);assert.deepEqual(request.edgeIds,step.intent.edgeIds);}
   const handle=Object.freeze({recordedTransportId:++next});handles.set(handle,{step});return{...structuredClone(step.observed.result),handle};
  },
  async readSolidMesh(request){
   meshReads.push(request);const item=handles.get(request.handle);assert(item);const m=item.step.observed.mesh,coords=new Float64Array(m.coordinates);
   // Original Float32 buffers were not retained. This generated protocol preview
   // is explicitly a projection fixture, not a native Float32 observation.
   return{contractVersion:1,op:'solid.mesh.read',unit:'millimeter',quality:'display-only',triangleCount:m.triangleCount,buffer:coords.buffer,displayBuffer:new Float32Array(coords).buffer,displayStatus:'available',displayReason:null,evidence:structuredClone(m.evidence)};
  },
  assertSolidBinding(handle){assert(handles.has(handle),'Unknown protocol handle');},close(){closes++;handles.clear();}
 };
 const registry={find:id=>objects.get(id),findFace:id=>faces.get(id)};
 const run=(kind,intent)=>evaluateWorkerSolid({owner,kind,request:intent,sourceBinding:kind==='profile'?sourceBinding:undefined,registry,createMount:(engine,rev)=>{factoryCalls++;assert.equal(engine,'occ');assert.equal(rev,revision);return mount;},validateMount:(engine,m,rev)=>{assert.equal(engine,'occ');assert.equal(m,mount);assert.equal(rev,revision);},createModel:(...args)=>{projections.push(args);return projection(...args);},valid:()=>true});
 async function apply(step){sourceBinding=step.sourceBinding;selectedStep=step;const output=await run(step.kind,step.intent);assert.equal(selectedStep,null);output.publicationCheck();for(const m of output.consumed){assert.equal(objects.get(m.id),m);objects.delete(m.id);}objects.set(output.model.id,output.model);outputs.push(output);return output;}
 return{...data,owner,objects,faces,face,calls,meshReads,projections,outputs,mount,run,apply,get closes(){return closes;},get factoryCalls(){return factoryCalls;},inspect:model=>inspectWorkerSolidSelections(model)};
}
