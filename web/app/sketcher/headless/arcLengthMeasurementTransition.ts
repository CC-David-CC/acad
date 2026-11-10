import {dimensionLocator} from './drivingDimensionTarget.mjs';
import {firstCapturedGeometryDifference as difference} from './capturedGeometryScope';
import {HeadlessSketchWorkspace} from './workspace';
import {solveSketch} from './solve';
import {evaluateCapturedSketch} from './capturedSketchEvaluation';
import {assertVerifiedReplayGeometry} from './verifiedReplayGeometry';
import {capturedParameterOwnership,installCapturedAuxiliaryWitnesses} from './capturedParameterOwnership';
import {inspectArcLengthMeasurementModel,prepareArcLengthMeasurement} from '../actions/arcLengthMeasurementPreparation';
import {captureArcLengthMeasurementRequest,captureArcLengthMeasurementReply} from './arcLengthMeasurementIntent.mjs';
import {failureCause,withAdmissionCause} from '../constr/admissionCause.mjs';
const fail=(code:string,message:string):never=>{throw Object.assign(Error(message),{code});};
const text=(v:any)=>{const s=JSON.stringify(v);if(s.length>1048576||new TextEncoder().encode(s).byteLength>1048576)fail('RESOURCE_LIMIT','Length measurement source exceeds 1MiB.');return s;};
const failure=(revision:string,e:any)=>{const cause=failureCause(e);return{revision,ok:false as const,error:{code:typeof e?.code==='string'?e.code.slice(0,64):'MEASUREMENT_INVALID',message:typeof e?.message==='string'?e.message.slice(0,512):'Length measurement failed.',...(cause?{cause}:{})}};};
function cold(revision:string,sketch:any,external:any){let auxiliary:any;const result=solveSketch({revision,sketch:structuredClone(sketch),boundary:structuredClone(sketch.boundary),externalParameters:external},undefined,batch=>{auxiliary=batch;});if(!result.ok)throw withAdmissionCause(Object.assign(Error(result.error.message),{code:result.error.code}),result.error.cause);return{result,auxiliary};}
function coordinateProof(sketch:any,external:any,observation:any){assertVerifiedReplayGeometry(sketch,observation.result.sketch,observation.result.evidence,external);return evaluateCapturedSketch(sketch,external,observation.result.evidence,undefined,observation.auxiliary);}
function decode<T>(sketch:any,external:any,observation:any,visit:(w:HeadlessSketchWorkspace)=>T):T{
 const w=new HeadlessSketchWorkspace(external);return w.io.evaluateCapturedSketch(structuredClone(sketch),()=>{const own=capturedParameterOwnership(w);installCapturedAuxiliaryWitnesses(w,own,observation.auxiliary);const result=visit(w);own.unchanged();return result;});
}
function classifications(sketch:any,evidence:any[]){let n=0;for(const stage of sketch.stages)for(const row of stage.constraints){const e=evidence[n++];if(!e||e.typeId!==row.typeId)fail('ADMISSION_CHANGED','Measurement equation membership differs.');row.admission={version:1,state:e.state};}if(n!==evidence.length)fail('ADMISSION_CHANGED','Unexpected measurement evidence.');}
function resultRows(sketch:any,external:any,proof:any){return decode(sketch,external,proof,w=>inspectArcLengthMeasurementModel(w));}
export function changeArcLengthMeasurement(request:any){const revision=typeof request?.revision==='string'?request.revision:'';try{
 const a=captureArcLengthMeasurementRequest(request);if(new TextEncoder().encode(a.sketchJSON).byteLength>1048576)fail('RESOURCE_LIMIT','Length measurement source exceeds1MiB.');const before=JSON.parse(a.sketchJSON);text(before);const original=cold(a.revision,before,a.externalParameters);coordinateProof(before,a.externalParameters,original);
 if(a.intent.action==='inspect'){const rows=resultRows(before,a.externalParameters,original);return captureArcLengthMeasurementReply({revision:a.revision,ok:true,changed:false,serializedSketch:a.sketchJSON,evidence:original.result.evidence,measurements:rows,measurement:null},a.revision);}
 // Admission is measured in a disposable ordinary model. Its solved geometry
 // is NEVER copied into publication. The shared editor preparation is reused.
 const w=new HeadlessSketchWorkspace(a.externalParameters);w.io._loadSketch(structuredClone(before),{strict:true});const pm=w.parametricManager,prepared=prepareArcLengthMeasurement(w,a.intent,a.allocatedId),candidate=structuredClone(before);
 if(prepared.changed){pm.startTransaction();try{prepared.mutate();pm.finishTransaction(prepared.validateAdmission,false);}catch(e){if(pm.inTransaction)try{pm.finishTransaction(()=>{throw e;},false);}catch{}throw e;}
  if(prepared.removed){const d=prepared.sourceDriver;if(!d||candidate.stages[d.stage]?.constraints[d.index]?.typeId!=='ArcLength')fail('INTENT_CHANGED','Removed driver membership differs.');candidate.stages[d.stage].constraints.splice(d.index,1);}
  if(prepared.added){const c=prepared.added,stage=c.stage?.index,index=c.stage?.algNumSystem.allConstraints.filter(c=>!c.internal).indexOf(c);if(stage!==prepared.arc.stage.index||index!==candidate.stages[stage]?.constraints.length)fail('INTENT_CHANGED','The driving equation was not appended to its actual stage.');const row=c.write();row.admission={version:1,state:'accepted'};candidate.stages[stage].constraints.push(row);}
  if(prepared.removedRuler){const at=candidate.dimensions.findIndex(d=>d.id===prepared.ruler.id);if(at<0||candidate.dimensions.filter(d=>d.id===prepared.ruler.id).length!==1||difference(candidate.dimensions[at],{id:prepared.ruler.id,type:'ArcLengthDimension',data:prepared.ruler.write()})!=='no difference')fail('INTENT_CHANGED','Reference removal lost its original native serialized ruler.');candidate.dimensions.splice(at,1);}
  if(prepared.addedRuler)candidate.dimensions.push({id:prepared.ruler.id,type:'ArcLengthDimension',data:prepared.ruler.write()});
 }
 // A no-op still validates the exact target and full source above. No numeric
 // measurement/role is saved: only the normal ruler endpoints/offset and row.
 if(!prepared.changed){const rows=resultRows(before,a.externalParameters,original),measurement=rows.find(r=>r.arcId===prepared.arc.id);return captureArcLengthMeasurementReply({revision:a.revision,ok:true,changed:false,serializedSketch:a.sketchJSON,evidence:original.result.evidence,measurements:rows,measurement},a.revision);}
 const proof=cold(a.revision,candidate,a.externalParameters);assertVerifiedReplayGeometry(candidate,proof.result.sketch,proof.result.evidence,a.externalParameters);classifications(candidate,proof.result.evidence);
 const confirmed=cold(a.revision,candidate,a.externalParameters);coordinateProof(candidate,a.externalParameters,confirmed);const checked=evaluateCapturedSketch(candidate,a.externalParameters,confirmed.result.evidence,undefined,confirmed.auxiliary);
 // This check also covers unconstrained, disconnected and unsupported carried
 // geometry: candidate data came exclusively from the original source.
 if(JSON.stringify(candidate.objects)!==JSON.stringify(before.objects))fail('CURRENT_GEOMETRY_MISMATCH','Length-role conversion changed geometry.');
 const rows=resultRows(candidate,a.externalParameters,confirmed),measurement=rows.find(r=>r.arcId===prepared.arc.id&&r.measurementId===(prepared.removedRuler?null:prepared.ruler.id));if(!measurement||measurement.role!==prepared.role||measurement.reason)fail('ADMISSION_CHANGED','The actual ruler/driver did not acquire its requested role.');
 return captureArcLengthMeasurementReply({revision:a.revision,ok:true,changed:true,serializedSketch:text(candidate),evidence:checked.evidence,measurements:rows,measurement},a.revision);
 }catch(e){return failure(revision,e);}}
// Bind receipt metadata to the independent original-request reconstruction,
// not merely to another row in the first Worker's own response. Solver
// residual arrays are validated normally and are not compared bit-for-bit.
export function verifyArcLengthMeasurement(request:any){const revision=typeof request?.revision==='string'?request.revision:'';try{const a=captureArcLengthMeasurementRequest(request,true),{candidateJSON,measurements,measurement,...input}=a,expected=changeArcLengthMeasurement(input);if(!expected.ok)return expected;if(expected.serializedSketch!==candidateJSON)fail('CANDIDATE_MISMATCH','The exact original length-role request reconstructs a different candidate.');if(JSON.stringify(expected.measurements)!==JSON.stringify(measurements)||JSON.stringify(expected.measurement)!==JSON.stringify(measurement))fail('MEASUREMENT_MISMATCH','The ruler identity, role, canonical value or current driver metadata differs from independent reconstruction.');return{revision:a.revision,ok:true as const,verified:true};}catch(e){return failure(revision,e);}}

// Exact historical membership reconstruction; no generic dimension mutation
// authority. Ordinary existing-driver value edits use drivingDimensionTransition.
export function arcLengthMeasurementTravelDelta(before:any,after:any){
 if(!Array.isArray(before?.dimensions)||!Array.isArray(after?.dimensions)||!Array.isArray(before?.stages)||before.stages.length!==after?.stages?.length)return null;
 if(Math.abs(before.dimensions.length-after.dimensions.length)===1){const insert=after.dimensions.length>before.dimensions.length,large=insert?after:before,small=insert?before:after;let at=0;while(at<small.dimensions.length&&JSON.stringify(large.dimensions[at])===JSON.stringify(small.dimensions[at]))at++;const row=large.dimensions[at];if(row?.type==='ArcLengthDimension')return{kind:'ruler',large,small,row};}
 for(let stage=0;stage<before.stages.length;stage++){const a=before.stages[stage].constraints,b=after.stages[stage].constraints;if(Math.abs(a.length-b.length)!==1)continue;const insert=b.length>a.length,large=insert?after:before,small=insert?before:after,rows=large.stages[stage].constraints,other=small.stages[stage].constraints;let index=0;const semantic=row=>{const c={...row};delete c.admission;return JSON.stringify(c);};while(index<other.length&&semantic(rows[index])===semantic(other[index]))index++;if(rows[index]?.typeId==='ArcLength')return{kind:'driver',large,small,stage,index,row:rows[index]};}
 return null;
}
export function verifyArcLengthMeasurementTravel(request:any){const revision=typeof request?.revision==='string'?request.revision:'';try{
 const keys=['revision','sketchJSON','candidateJSON','externalParameters'];if(!request||Reflect.ownKeys(request).length!==keys.length||keys.some(k=>!Object.getOwnPropertyDescriptor(request,k)?.enumerable||!Object.hasOwn(Object.getOwnPropertyDescriptor(request,k),'value')))fail('INVALID_CANDIDATE','Invalid ArcLength historical pair.');
 for(const v of[request.sketchJSON,request.candidateJSON])if(typeof v!=='string'||new TextEncoder().encode(v).byteLength>1048576)fail('RESOURCE_LIMIT','ArcLength travel source exceeds1MiB.');
 const delta=arcLengthMeasurementTravelDelta(JSON.parse(request.sketchJSON),JSON.parse(request.candidateJSON));if(!delta)fail('INTENT_CHANGED','Travel is not one native ArcLength membership operation.');
 const source=delta.kind==='ruler'?delta.small:delta.large,target=delta.kind==='ruler'?delta.large:delta.small,intent=delta.kind==='ruler'?{action:'create',arcId:delta.row.data.arc}:{action:'convert',target:{constraintId:dimensionLocator(delta.stage,delta.index,delta.row)},role:'reference'},allocatedId=delta.kind==='ruler'?delta.row.id:null;
 const result=changeArcLengthMeasurement({revision,sketchJSON:JSON.stringify(source),externalParameters:request.externalParameters,intent,allocatedId});if(!result.ok)return result;if(result.serializedSketch!==JSON.stringify(target))fail('INTENT_CHANGED','ArcLength historical pair differs from its exact original membership operation.');return{revision,ok:true as const,verified:true};
 }catch(e){return failure(revision,e);}}
