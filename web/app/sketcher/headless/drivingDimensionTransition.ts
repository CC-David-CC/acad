import {changePointLineDistanceDimension} from './pointLineDistanceTransition';
import {changeProjectedDistanceDimension} from './projectedDistanceDimensionTransition';
import {changeRadiusDimension} from './radiusTransition';
import {HeadlessSketchWorkspace} from './workspace';
import {replaySketchTransition} from './sketchTransition';
import {solveSketch} from './solve';
import {projectRenderSketch} from './renderSketchProjection.mjs';
import {assertAllowedSolverGeometry} from './transitionGeometryPolicy.mjs';
import {captureAdmissionCause,causeForSolveStatus,withAdmissionCause} from '../constr/admissionCause.mjs';
import {validateConstraintGeometry} from './sketchValidation';
import {sameRestoredSketch} from '../historyEquivalence.mjs';
import {assertVerifiedReplayGeometry,assertUnrelatedSignedGeometry} from './verifiedReplayGeometry';
import {firstCapturedGeometryDifference,captureConnectedGeometryScope,applyCapturedGeometry,assertCapturedGeometryScope} from './capturedGeometryScope';
import {evaluateCapturedSketch} from './capturedSketchEvaluation';
import type {CapturedAuxiliaryWitnessBatch} from './capturedParameterOwnership';
import {ConstraintDefinitions} from '../constr/ANConstraints';
import {Segment} from '../shapes/segment';
import {captureRectangleDimensionBindings,reconstructTypedRectangle} from './typedRectangleReconstruction';
import {EndPoint} from '../shapes/point';
import {captureDrivingDimensionIntent,resolveDrivingDimension,drivingLengthField,classifyDrivingDimensionDelta,signedDrivingDimension,drivingDimensionValueValid} from './drivingDimensionTarget.mjs';
const fail=(code:string,message:string)=>Object.assign(Error(message),{code});
const failure=(error:any)=>({code:typeof error?.code==='string'?error.code.slice(0,64):'DIMENSION_INVALID',message:typeof error?.message==='string'?error.message.slice(0,512):'Existing dimension change failed.',...(error?.cause?{cause:captureAdmissionCause(error.cause)}:{})});
function record(v:any,keys:string[]){if(!v||typeof v!=='object'||Array.isArray(v)||![Object.prototype,null].includes(Object.getPrototypeOf(v))||Reflect.ownKeys(v).length!==keys.length)throw fail('INVALID','Invalid driving dimension request.');const o:any={};for(const k of keys){const d=Object.getOwnPropertyDescriptor(v,k);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw fail('INVALID','Dimension fields must be data.');o[k]=d.value;}return o;}
function external(v:any){const o=record(v,Reflect.ownKeys(v||{}) as string[]),out=Object.create(null);if(Object.keys(o).length>1024)throw fail('LIMIT','Too many dimension parameters.');for(const k of Object.keys(o)){if(!k||k.length>256||typeof o[k]!=='number'||!Number.isFinite(o[k])||Math.abs(o[k])>1e9)throw fail('INVALID','Invalid dimension parameter.');out[k]=o[k];}return out;}
function bounded(v:any){if(typeof v!=='string'||v.length>1048576||new TextEncoder().encode(v).byteLength>1048576)throw fail('LIMIT','The dimension source exceeds its limit.');return v;}
function revisionOf(v:any){const d=v&&Object.getOwnPropertyDescriptor(v,'revision');return d?.enumerable&&Object.prototype.hasOwnProperty.call(d,'value')&&typeof d.value==='string'?d.value:'';}
function replay(revision:string,text:string,bindings:any,onAuxiliaryWitness?:(batch:CapturedAuxiliaryWitnessBatch)=>void){const r=replaySketchTransition({revision,sketchJSON:bounded(text),externalParameters:bindings},onAuxiliaryWitness);if(!r.ok||!('serializedSketch' in r))throw Object.assign(Error(r.error.message),r.error);return r;}
// Resolve against canonical handles projected in this Worker from the same
// captured/replayed source. No point rows are accepted from the public request.
function dimensionPoints(sketch:any){
 const source={...sketch,objects:sketch.objects.filter(o=>['Point','Segment','Circle','Arc'].includes(o.type))};
 return projectRenderSketch(source).objects.flatMap(object=>object.handles);
}
function resolveDimension(sketch:any,id:string){return resolveDrivingDimension(sketch,id,dimensionPoints(sketch));}
function geometry(before:any,after:any){if(before.objects.length!==after.objects.length)throw fail('INTENT_CHANGED','Sketch object membership changed.');after.objects.forEach((o,i)=>{if(before.objects[i]?.type!==o.type)throw fail('INTENT_CHANGED','Sketch object type changed.');assertAllowedSolverGeometry(o.type,before.objects[i].data,o.data);});}
function evidence(sketch:any,rows:any[]){const c=sketch.stages.flatMap(s=>s.constraints);if(c.length!==rows.length||c.some((v,i)=>v.typeId!==rows[i].typeId||v.admission?.version!==1||v.admission.state!==rows[i].state))throw fail('ADMISSION_CHANGED','Dimension admission changed during verification.');}
// Passive Worker-local evidence only. Do not reconstruct/solve a diagnostic
// workspace or infer the cold native frame from its serialized endpoints.
// Columns: actual stage/native-row, angle radians, signed t mm, inverted,
// resolved distance mm, ORIGINAL DistancePL residual mm. No public IDs/source.
function warmPointLineFrames(workspace:any,edited:any):string{
 try{
  const selected=new Set(edited.objects),rows:any[]=[];let visits=0,bytes=2,limited=false;
  for(const stage of workspace.parametricManager.stages){
   const constraints=stage.solverSystem.allConstraints;
   for(let index=0;index<constraints.length;index++){
    if(++visits>4096){limited=true;break;}
    const c=constraints[index];if(c.schema!==ConstraintDefinitions.DistancePL||c.stage!==stage||c.objects.length!==2)continue;
    const [point,line]=c.objects;
    if(!(point instanceof EndPoint)||!(line instanceof Segment)||![point,line,line.a,line.b].some(o=>selected.has(o)))continue;
    const angle=line.params.ang.get(),length=line.params.t.get(),distance=c.resolvedConstants?.distance,inverted=c.resolvedConstants?.inverted,polynomials=[];
    c.collectPolynomials(polynomials);const residual=polynomials.length===1?polynomials[0].value():null;
    if(![angle,length,distance,residual].every(n=>typeof n==='number'&&Number.isFinite(n))||typeof inverted!=='boolean')continue;
    const row=[stage.index,index,angle,length,inverted,distance,residual],size=JSON.stringify(row).length+1;
    if(rows.length===2||bytes+size>200){limited=true;break;}
    rows.push(row);bytes+=size;
   }
   if(limited)break;
  }
  return(rows.length?JSON.stringify(rows):'unavailable')+(limited?':bounded':'');
 }catch{return'unavailable';}
}
function replayMismatch(candidate:any,cold:any,warmFrames:string){
 let difference='unavailable';try{difference=firstCapturedGeometryDifference(candidate,cold).slice(0,200);}catch{/* Preserve the original refusal. */}
 // Existing error/DTO and acceptance criteria stay unchanged. This message is
 // returned only to this request, never sent to a general-purpose log.
 return fail('CURRENT_GEOMETRY_MISMATCH',('Dimension verification changed solved geometry. diff='+difference+' warmPL='+warmFrames+' coldNativeFrame=unavailable').slice(0,512));
}
function expectedDelta(before:any,after:any,intent:any,action:string){
 const row=resolveDimension(before,intent.constraintId),field=drivingLengthField(row.typeId),expected=structuredClone(before);
 if(action==='edit')expected.stages[row.stage].constraints[row.index].constants[field]=String(intent.value);else expected.stages[row.stage].constraints.splice(row.index,1);
 // Both actual and expected geometry are independently checked by the caller.
 const strip=(s:any)=>({...s,objects:s.objects.map(o=>({...o,data:null})),stages:s.stages.map(stage=>({...stage,constraints:stage.constraints.map(c=>{const x={...c};delete x.admission;return x})}))});
 if(!sameRestoredSketch(JSON.stringify(strip(expected)),JSON.stringify(strip(after))))throw fail('INTENT_CHANGED','Other authored sketch intent changed.');return row;
}
// PM transaction admission operates on raw algebra systems. Its warm result
// is not a stage result: real generators run only through SolveStage.solve.
// Finish that actual lifecycle before serializing a dimension candidate.
// This is one ordered construction pass, not a retry/polishing loop.
function finishGeneratedDimensionStages(workspace:any,stages:any[]){
 const index=workspace.createIndex(),roster=stages.map(stage=>({stage,objects:[...stage.objects],generators:[...stage.generators].map((generator:any)=>{
  const sources:any[]=[];generator.sourceObjects(o=>sources.push(o));
  return{generator,sources,outputs:[...generator.generatedObjects],record:JSON.stringify(generator.write())};
 })})),completed:Array<Map<any,number>>=[];let work=0;
 const charge=()=>{if(++work>100000)throw fail('LIMIT','Dimension generator validation exceeds its existing Worker work envelope.');};
 for(const {stage,generators}of roster){
  for(const {generator,sources,outputs}of generators){
   charge();if(generator.stage!==stage||sources.some(o=>index[o.id]!==o)||outputs.some(o=>index[o.id]!==o||o.stage!==stage||o.generator!==generator))throw fail('GENERATOR_CHANGED','The dimension candidate lost actual generator source/output custody.');
  }
  stage.solverSystem.prepare();stage.solve(false);
  if(!stage.solverSystem.solveStatus.success||!Number.isFinite(stage.solverSystem.solveStatus.error))throw withAdmissionCause(fail('DIMENSION_REJECTED','The complete native stage solve did not establish the dimension change.'),causeForSolveStatus(stage.solverSystem.solveStatus));
  for(const prior of completed)for(const [parameter,value]of prior){charge();if(!Object.is(parameter.get(),value))throw fail('STAGE_CHANGED','A later dimension stage changed an earlier native owner.');}
  const values=new Map<any,number>();for(const object of stage.objects)object.visitParams(p=>{charge();if(!Number.isFinite(p.get()))throw fail('INVALID','Native dimension regeneration produced a nonfinite parameter.');values.set(p,p.get());});completed.push(values);
 }
 // Validate AFTER all real regenerations, including every original intrinsic
 // and retained authored equation. A fresh cache is never proof of admission.
 const afterIndex=workspace.createIndex();
 for(const {stage,objects,generators}of roster){
  if(stage.objects.size!==objects.length||[...stage.objects].some((o,i)=>o!==objects[i])||stage.generators.size!==generators.length||[...stage.generators].some((g,i)=>g!==generators[i].generator))throw fail('GENERATOR_CHANGED','Dimension regeneration changed native stage membership.');
  for(const {generator,sources,outputs,record}of generators){
   const actual:any[]=[];generator.sourceObjects(o=>actual.push(o));
   if(JSON.stringify(generator.write())!==record||actual.length!==sources.length||actual.some((o,i)=>o!==sources[i]||afterIndex[o.id]!==o)||generator.generatedObjects.length!==outputs.length||generator.generatedObjects.some((o,i)=>o!==outputs[i]||afterIndex[o.id]!==o||o.generator!==generator||o.stage!==stage))throw fail('GENERATOR_CHANGED','Dimension regeneration changed ordered generator identity or dependencies.');
  }
  const sys=stage.solverSystem;
  for(const constraint of sys.allConstraints){charge();if(constraint.stage!==stage||constraint.objects.some(o=>afterIndex[o.id]!==o))throw fail('INTENT_CHANGED','The dimension stage lost original constraint ownership.');
   if(sys.conflicting.has(constraint)&&!sys.redundant.has(constraint))throw withAdmissionCause(fail('DIMENSION_REJECTED','The constraint change was rejected after actual generator regeneration.'),sys.getAdmissionCause(constraint));
   constraint.resolveConstants(workspace.parametricManager.constantResolver);validateConstraintGeometry(constraint);
  }
 }
}
// A negative private Polar chart is not itself invalid. Only an affected actual
// source Segment with a retained side-sensitive consumer needs this explicit
// source-frame construction phase. Other raw angle/t equations remain original
// constraints and may legitimately select a negative-t chart again on resolve.
function sourceFrameSegments(workspace:any,source:any,fields:Map<string,Set<string>>){
 const index=workspace.createIndex(),roots=new Map(source.objects.map(o=>[o.id,o])),selected=new Set<Segment>();let work=0;
 for(const stage of workspace.parametricManager.stages)for(const c of stage.solverSystem.allConstraints){
  if(++work>100000)throw fail('LIMIT','Dimension source-frame discovery exceeds its Worker bound.');
  const line=c.schema===ConstraintDefinitions.DistancePL?c.objects[1]:c.schema===ConstraintDefinitions.TangentLC?c.objects[0]:null;
  if(!(line instanceof Segment)||!(line.params.t.get()<0)||!(fields.get(line.id)?.size))continue;
  const root:any=roots.get(line.id);
  if(!root||root.type!=='Segment'||index[line.id]!==line||line.parent||!line.stage||!line.stage.objects.has(line)||c.stage!==stage)continue;
  if(stage.solverSystem.conflicting.has(c)&&!stage.solverSystem.redundant.has(c))continue;
  selected.add(line);
 }
 return [...selected];
}
function dimensionComponentScope(source:any,bindings:any,rows:any[],auxiliary:CapturedAuxiliaryWitnessBatch|undefined,row:any){
 return captureConnectedGeometryScope(source,bindings,rows,auxiliary,(_workspace,pm,index)=>{
  const stage=pm.stages[row.stage],constraint=stage?.solverSystem.allConstraints.filter(c=>!c.internal)[row.index];
  if(!constraint||constraint.schema!==ConstraintDefinitions[row.typeId]||constraint.objects.length!==row.objects.length||constraint.objects.some((o,i)=>index[row.objects[i]]!==o))throw fail('INVALID_TARGET','The original dimension component lost its registered row or owned targets.');
  constraint.resolveConstants(pm.constantResolver);validateConstraintGeometry(constraint);
  const equations=[];constraint.collectPolynomials(equations);
  return{equations,value:null};
 },'Dimension source-frame construction');
}
function validateWarmDimension(workspace:any){
 let work=0;const index=workspace.createIndex();
 for(const stage of workspace.parametricManager.stages){const sys=stage.solverSystem;
  if(!sys.solveStatus.success||!Number.isFinite(sys.solveStatus.error))throw withAdmissionCause(fail('DIMENSION_REJECTED','Dimension construction did not establish a finite native stage.'),causeForSolveStatus(sys.solveStatus));
  for(const constraint of sys.allConstraints){
   if(++work>100000)throw fail('LIMIT','Dimension original-equation validation exceeds its Worker bound.');
   if(constraint.stage!==stage||constraint.objects.some(o=>index[o.id]!==o))throw fail('INTENT_CHANGED','Dimension construction lost original constraint ownership.');
   if(sys.conflicting.has(constraint)&&!sys.redundant.has(constraint))throw withAdmissionCause(fail('DIMENSION_REJECTED','Dimension construction rejected an original equation.'),sys.getAdmissionCause(constraint));
   constraint.resolveConstants(workspace.parametricManager.constantResolver);validateConstraintGeometry(constraint);
  }
 }
}
// Mutation-only construction for the actual owned eleven-row declaration.
// Source coordinates do not select a rectangle by an AABB or proximity: the
// existing helper authenticates registered ownership, ordered connectivity,
// directed H/V branches, the actual anchor and both actual driving rows.
function changeDeclaredRectangleDimension(revision:string,source:string,authored:any,row:any,intent:any,bindings:any){
 // The existing recognizer interprets placement literals only. A named/local
 // H/V angle or locked coordinate is NOT invalid merely because this optional
 // constructor cannot interpret it. Leave the ORIGINAL request to generic
 // native resolution/domain/ownership/proof, with no swallowed helper error.
 const placementLiteral=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
 for(const stage of authored.stages)for(const c of stage.constraints){
  const fields=c.typeId==='LockPoint'?['x','y']:c.typeId==='Horizontal'||c.typeId==='Vertical'?['angle']:[];
  for(const field of fields){const raw=c.constants?.[field];if(typeof raw==='string'&&!placementLiteral.test(raw.trim()))return null;}
 }
 const request={revision,sketch:authored,boundary:authored.boundary,externalParameters:bindings},declaration=captureRectangleDimensionBindings(request);
 if(!declaration)return null;
 const sameRow=(bound:any)=>bound.stage===row.stage&&bound.index===row.index;
 if(!sameRow(declaration.widthRow)&&!sameRow(declaration.heightRow))return null;
 if(typeof row.rawValue==='string'&&/^[A-Za-z_$][A-Za-z0-9_$]{0,127}$/.test(row.rawValue.trim())&&typeof intent.value==='number')throw fail('BOUND_DIMENSION','A driving dimension bound to a typed name cannot be silently replaced by a literal. Edit the parameter or submit a named binding.');
 const value=typeof intent.value==='number'?intent.value:bindings[intent.value];
 if(!drivingDimensionValueValid('SegmentLength',value))throw fail('INVALID_VALUE','A current positive typed length or literal millimeters is required.');
 // Prove the ORIGINAL captured source before constructing any mutation. The
 // two cold reconstructions are evidence only; captured equations validate
 // its exact declared coordinates without publishing optimizer coordinates.
 const original=reconstructTypedRectangle(request);
 if(original===null)throw fail('RECTANGLE_DECLARATION_BINDING','The captured rectangle lost its actual declaration.');
 if(!original.ok)return original;
 const dimension=(sketch:any)=>{const actual=resolveDimension(sketch,intent.constraintId);return{constraintId:intent.constraintId,action:'edit',typeId:actual.typeId,objects:[...actual.objects],rawValue:actual.rawValue,resolvedValue:actual.resolvedValue,status:sketch.stages[actual.stage].constraints[actual.index].admission.state};};
 if(String(row.rawValue)===String(intent.value))return{revision,ok:true,changed:false,serializedSketch:source,evidence:original.evidence,dimension:dimension(authored)};
 const draft=structuredClone(authored);draft.stages[row.stage].constraints[row.index].constants.length=String(intent.value);
 const prepared=reconstructTypedRectangle({...request,sketch:draft},{update:true});
 // Null is this helper's established numeric/declaration eligibility boundary,
 // not a new restriction of generic positive SegmentLength capabilities. A
 // recognized declaration's failed cold/captured proof NEVER falls back.
 if(prepared===null)return null;
 if(!prepared.ok)return prepared;
 const candidate=prepared.sketch;
 geometry(authored,candidate);expectedDelta(authored,candidate,intent,'edit');evidence(candidate,prepared.evidence);
 const next=dimension(candidate);
 if(next.typeId!=='SegmentLength'||next.objects.length!==row.objects.length||next.objects.some((id,i)=>id!==row.objects[i])||next.rawValue!==String(intent.value)||Math.abs(next.resolvedValue-value)>1e-6)throw fail('INTENT_CHANGED','The declared rectangle changed its requested driving row.');
 return{revision,ok:true,changed:true,serializedSketch:bounded(prepared.serializedSketch),evidence:prepared.evidence,dimension:next};
}
export function changeDrivingDimension(request:any){let revision=revisionOf(request);try{
 const a=record(request,['revision','sketchJSON','externalParameters','action','intent']);if(!revision||revision.length>256)throw fail('INVALID','Invalid dimension revision.');const intent=captureDrivingDimensionIntent(a.intent,a.action),bindings=external(a.externalParameters);
 const authored=JSON.parse(bounded(a.sketchJSON)),authoredTarget=resolveDimension(authored,intent.constraintId);if(authoredTarget.typeId==='DistancePL')return changePointLineDistanceDimension({revision,sketchJSON:a.sketchJSON,externalParameters:bindings,intent},a.action);if(authoredTarget.typeId==='ProjectedDistance')return changeProjectedDistanceDimension({revision,sketchJSON:a.sketchJSON,externalParameters:bindings,action:a.action,intent});if(authoredTarget.typeId==='RadiusLength')return changeRadiusDimension({revision,sketchJSON:a.sketchJSON,externalParameters:bindings,intent},a.action);
 if(a.action==='edit'&&authoredTarget.typeId==='SegmentLength'){
  const declared=changeDeclaredRectangleDimension(revision,a.sketchJSON,authored,authoredTarget,intent,bindings);
  if(declared!==null)return declared;
 }
 const hasSideConsumer=authored.stages.some(stage=>stage.constraints.some(c=>c.typeId==='DistancePL'||c.typeId==='TangentLC'));
 let originalAuxiliary:CapturedAuxiliaryWitnessBatch|undefined;
 const captured=replay(revision,a.sketchJSON,bindings,hasSideConsumer?batch=>{originalAuxiliary=batch;}:undefined),before=JSON.parse(captured.serializedSketch),row=resolveDimension(before,intent.constraintId);
 let value:any=null;if(a.action==='edit'){
  if(typeof row.rawValue==='string'&&/^[A-Za-z_$][A-Za-z0-9_$]{0,127}$/.test(row.rawValue.trim())&&typeof intent.value==='number')throw fail('BOUND_DIMENSION','A driving dimension bound to a typed name cannot be silently replaced by a literal. Edit the parameter or submit a named binding.');
  value=typeof intent.value==='number'?intent.value:bindings[intent.value];
  if(!drivingDimensionValueValid(row.typeId,value))throw fail('INVALID_VALUE',signedDrivingDimension(row.typeId)?'A current signed length within plus or minus 1,000,000mm is required.':row.typeId==='DistancePP'?'A current Euclidean typed length or literal from0 to1,000,000mm is required.':'A current positive typed length or literal millimeters is required.');
 }
 const dimension=(rawValue:any,resolvedValue:any,status:string)=>({constraintId:intent.constraintId,action:a.action,typeId:row.typeId,objects:[...row.objects],rawValue,resolvedValue,status});
 if(a.action==='edit'&&String(row.rawValue)===String(intent.value))return {revision,ok:true,changed:false,serializedSketch:a.sketchJSON,evidence:captured.evidence,dimension:dimension(row.rawValue,row.resolvedValue,before.stages[row.stage].constraints[row.index].admission.state)};
 const scope=hasSideConsumer?dimensionComponentScope(authored,bindings,captured.evidence,originalAuxiliary,authoredTarget):null;
 const workspace=new HeadlessSketchWorkspace(bindings);workspace.io._loadSketch(before,{strict:true});const pm=workspace.parametricManager,c=pm.stages[row.stage]?.algNumSystem.allConstraints.filter(c=>!c.internal)[row.index];
 if(!c||c.schema.id!==row.typeId||c.objects.length!==row.objects.length||c.objects.some((object,i)=>object.id!==row.objects[i]))throw fail('INVALID_TARGET','The reconstructed dimension identity changed.');
 const field=drivingLengthField(row.typeId);if(a.action==='edit')c.validateCandidateConstants({...c.constants,[field]:String(intent.value)},pm.constantResolver);
 pm.startTransaction();try{
  if(a.action==='edit')c.updateConstant(field,String(intent.value));else pm._removeConstraint(c);
  pm.finishTransaction(stages=>{
   if(stages.some(stage=>stage.generators.size))finishGeneratedDimensionStages(workspace,stages);
   else for(const stage of stages)for(const constraint of stage.algNumSystem.allConstraints)if(stage.algNumSystem.conflicting.has(constraint)&&!stage.algNumSystem.redundant.has(constraint))throw Object.assign(fail('DIMENSION_REJECTED','The constraint change was rejected by the sketch solver.'),{cause:stage.algNumSystem.getAdmissionCause(constraint)});
  },false);
 }catch(error){if(pm.inTransaction)try{pm.finishTransaction(()=>{throw error},false)}catch(_){}throw error;}
 let candidate=JSON.parse(workspace.io.serializeSketch(before.metadata,{strict:true}));candidate.boundary=before.boundary;geometry(before,candidate);expectedDelta(before,candidate,intent,a.action);
 const frames=scope?sourceFrameSegments(workspace,authored,scope.fields):[];
 if(frames.length){
  // Check the actual whole warm result BEFORE changing any derived frame;
  // never repair an invalid optimizer result by restoring unrelated fields.
  validateWarmDimension(workspace);expectedDelta(authored,candidate,intent,a.action);assertCapturedGeometryScope(authored,candidate,scope.fields,'Dimension source-frame construction');
  for(const line of frames)line.syncGeometry();
  // ONE explicit construction resolve, not a retry/polish loop. Full original
  // stage/generator equations retain their authority over the initialized chart.
  finishGeneratedDimensionStages(workspace,pm.stages);
  const resolved=JSON.parse(workspace.io.serializeSketch(authored.metadata,{strict:true}));resolved.boundary=structuredClone(authored.boundary);
  geometry(authored,resolved);expectedDelta(authored,resolved,intent,a.action);assertCapturedGeometryScope(authored,resolved,scope.fields,'Dimension source-frame construction');
  candidate={...resolved,objects:applyCapturedGeometry(authored,resolved,scope.fields,true,'Dimension source-frame construction')};
  geometry(authored,candidate);expectedDelta(authored,candidate,intent,a.action);assertCapturedGeometryScope(authored,candidate,scope.fields,'Dimension source-frame construction');
 }
 if(row.typeId==='DistancePP'&&a.action==='edit')assertUnrelatedSignedGeometry(before,candidate,bindings,{stage:row.stage,index:row.index});
 const warmFrames=warmPointLineFrames(workspace,c);
 let candidateAuxiliary:CapturedAuxiliaryWitnessBatch|undefined;
 const solved=solveSketch({revision,sketch:candidate,boundary:structuredClone(candidate.boundary),externalParameters:bindings},undefined,frames.length?batch=>{candidateAuxiliary=batch;}:undefined);if(!solved.ok)return solved;const coldSerialized=bounded(JSON.stringify(solved.sketch));
 if(row.typeId==='DistancePP')assertVerifiedReplayGeometry(candidate,solved.sketch,solved.evidence,bindings,a.action==='edit'?{stage:row.stage,index:row.index}:undefined);
 else if(!sameRestoredSketch(JSON.stringify(candidate),coldSerialized))throw replayMismatch(candidate,solved.sketch,warmFrames);evidence(solved.sketch,solved.evidence);
 let published=solved.sketch,publicationEvidence=solved.evidence,serializedSketch=coldSerialized;
 if(frames.length){
  assertCapturedGeometryScope(authored,candidate,scope.fields,'Dimension source-frame construction');
  const checked=evaluateCapturedSketch(candidate,bindings,solved.evidence,undefined,candidateAuxiliary);
  // Publish the actual constructed/captured-equation-validated source, never
  // copy the verification optimizer output into its authoritative geometry.
  published=candidate;publicationEvidence=checked.evidence;serializedSketch=bounded(JSON.stringify(candidate));
 }
 let next:any=null;if(a.action==='edit'){next=resolveDimension(published,intent.constraintId);if(Math.abs(next.resolvedValue-value)>1e-6)throw fail('RESIDUAL','The edited dimension differs from actual solved geometry.');}
 return {revision,ok:true,changed:true,serializedSketch,evidence:publicationEvidence,dimension:dimension(next?.rawValue??null,next?.resolvedValue??null,next?published.stages[row.stage].constraints[row.index].admission.state:'removed')};
 }catch(error){return {revision,ok:false,error:failure(error)};}}

// Second disposable Worker: no result obtains publication authority by itself.
export function verifyDrivingDimension(request:any,travel=false){let revision=revisionOf(request);try{
 const a=record(request,travel?['revision','sketchJSON','externalParameters','candidateJSON']:['revision','sketchJSON','externalParameters','candidateJSON','action','intent']);if(!revision||revision.length>256)throw fail('INVALID','Invalid dimension verification revision.');const bindings=external(a.externalParameters);
 // Recompute in this independent realm before replaying the supplied candidate.
 // Candidate validity alone does not protect an unrelated unconstrained loop.
 if(!travel){
  const intent=captureDrivingDimensionIntent(a.intent,a.action),expected=changeDrivingDimension({revision,sketchJSON:a.sketchJSON,externalParameters:bindings,action:a.action,intent});
  if(!expected.ok||!('serializedSketch' in expected))return {revision,ok:false,error:'error' in expected?expected.error:{code:'DIMENSION_INVALID',message:'Independent transition did not return a native source.'}};
  if(!sameRestoredSketch(expected.serializedSketch,bounded(a.candidateJSON)))throw fail('INTENT_CHANGED','Candidate geometry or authored intent differs from the independent dimension transition.');
 }
 const before=JSON.parse(replay(revision,a.sketchJSON,bindings).serializedSketch),afterResult=replay(revision,a.candidateJSON,bindings),after=JSON.parse(afterResult.serializedSketch);geometry(before,after);evidence(after,afterResult.evidence);
 if(travel){
  const delta=classifyDrivingDimensionDelta(before,after,dimensionPoints(before),dimensionPoints(after));if(!delta)throw fail('INTENT_CHANGED','Typed travel requires exactly one supported dimension edit or removal.');
  const literal=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
  const replacement=(raw:any)=>typeof raw==='string'&&literal.test(raw.trim())?Number(raw):raw;
  const attempts:Array<{source:string,target:string,action:'edit'|'remove',constraintId:string,value?:number|string}>=delta.action==='remove'?[{source:a.sketchJSON,target:a.candidateJSON,action:'remove',constraintId:delta.constraintId}]:delta.action==='insert'?[{source:a.candidateJSON,target:a.sketchJSON,action:'remove',constraintId:delta.constraintId}]:[
   {source:a.sketchJSON,target:a.candidateJSON,action:'edit',constraintId:delta.constraintId,value:replacement(delta.afterValue)},
   {source:a.candidateJSON,target:a.sketchJSON,action:'edit',constraintId:delta.constraintId,value:replacement(delta.beforeValue)}
  ];
  // Journal travel is symmetric: Undo must prove the original forward edit,
  // rather than demand that an underconstrained nonlinear solve be reversible.
  // At least one direction must independently reproduce the entire other state.
  let verified=false,computed=false,lastFailure:any=null;
  for(const trial of attempts){const intent=trial.action==='edit'?{constraintId:trial.constraintId,value:trial.value}:{constraintId:trial.constraintId},expected=changeDrivingDimension({revision,sketchJSON:trial.source,externalParameters:bindings,action:trial.action,intent});
   if(expected.ok&&'serializedSketch' in expected){computed=true;if(sameRestoredSketch(expected.serializedSketch,trial.target)){verified=true;break;}}else lastFailure='error' in expected?expected.error:{code:'DIMENSION_INVALID',message:'Independent transition did not return a native source.'};
  }
  if(!verified){if(!computed&&lastFailure)return {revision,ok:false,error:lastFailure};throw fail('INTENT_CHANGED','The journal pair does not match an independently reproduced dimension transition.');}
 }
 return {revision,ok:true,verified:true};
 }catch(error){return {revision,ok:false,error:failure(error)};}}
