import {firstCapturedGeometryDifference as difference} from './capturedGeometryScope';
import {HeadlessSketchWorkspace} from './workspace';
import {solveSketch} from './solve';
import {evaluateCapturedSketch} from './capturedSketchEvaluation';
import {assertVerifiedReplayGeometry} from './verifiedReplayGeometry';
import {capturedParameterOwnership,installCapturedAuxiliaryWitnesses} from './capturedParameterOwnership';
import {inspectLengthMeasurementModel,prepareLengthMeasurement,patternReferenceSegment} from '../actions/lengthMeasurementPreparation';
import {captureLengthMeasurementRequest,captureLengthMeasurementReply} from './lengthMeasurementIntent.mjs';
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
function resultRows(sketch:any,external:any,proof:any){return decode(sketch,external,proof,w=>inspectLengthMeasurementModel(w));}
export function changeLengthMeasurement(request:any){const revision=typeof request?.revision==='string'?request.revision:'';try{
 const a=captureLengthMeasurementRequest(request);if(new TextEncoder().encode(a.sketchJSON).byteLength>1048576)fail('RESOURCE_LIMIT','Length measurement source exceeds1MiB.');const before=JSON.parse(a.sketchJSON);text(before);const original=cold(a.revision,before,a.externalParameters);coordinateProof(before,a.externalParameters,original);
 if(a.intent.action==='inspect'){const rows=resultRows(before,a.externalParameters,original);return captureLengthMeasurementReply({revision:a.revision,ok:true,changed:false,serializedSketch:a.sketchJSON,evidence:original.result.evidence,measurements:rows,measurement:null},a.revision);}
 // Admission is measured in a disposable ordinary model. Its solved geometry
 // is NEVER copied into publication. The shared editor preparation is reused.
 const w=new HeadlessSketchWorkspace(a.externalParameters);w.io._loadSketch(structuredClone(before),{strict:true});const pm=w.parametricManager,prepared=prepareLengthMeasurement(w,a.intent,a.allocatedId),candidate=structuredClone(before);
 if(prepared.changed){pm.startTransaction();try{prepared.mutate();pm.finishTransaction(prepared.validateAdmission,false);}catch(e){if(pm.inTransaction)try{pm.finishTransaction(()=>{throw e;},false);}catch{}throw e;}
  if(prepared.removed){const d=prepared.sourceDriver;if(!d||candidate.stages[d.stage]?.constraints[d.index]?.typeId!=='SegmentLength')fail('INTENT_CHANGED','Removed driver membership differs.');candidate.stages[d.stage].constraints.splice(d.index,1);}
  if(prepared.added){const c=prepared.added,stage=c.stage?.index,index=c.stage?.algNumSystem.allConstraints.filter(c=>!c.internal).indexOf(c);if(stage!==prepared.segment.stage.index||index!==candidate.stages[stage]?.constraints.length)fail('INTENT_CHANGED','The driving equation was not appended to its actual stage.');const row=c.write();row.admission={version:1,state:'accepted'};candidate.stages[stage].constraints.push(row);}
  if(prepared.removedRuler){const at=candidate.dimensions.findIndex(d=>d.id===prepared.ruler.id);if(at<0||candidate.dimensions.filter(d=>d.id===prepared.ruler.id).length!==1||difference(candidate.dimensions[at],{id:prepared.ruler.id,type:'LinearDimension',data:prepared.ruler.write()})!=='no difference')fail('INTENT_CHANGED','Reference removal lost its original native serialized ruler.');candidate.dimensions.splice(at,1);}
  if(prepared.addedRuler)candidate.dimensions.push({id:prepared.ruler.id,type:'LinearDimension',data:prepared.ruler.write()});
 }
 // A no-op still validates the exact target and full source above. No numeric
 // measurement/role is saved: only the normal ruler endpoints/offset and row.
 if(!prepared.changed){const rows=resultRows(before,a.externalParameters,original),measurement=rows.find(r=>r.segmentId===prepared.segment.id);return captureLengthMeasurementReply({revision:a.revision,ok:true,changed:false,serializedSketch:a.sketchJSON,evidence:original.result.evidence,measurements:rows,measurement},a.revision);}
 const proof=cold(a.revision,candidate,a.externalParameters);assertVerifiedReplayGeometry(candidate,proof.result.sketch,proof.result.evidence,a.externalParameters);classifications(candidate,proof.result.evidence);
 const confirmed=cold(a.revision,candidate,a.externalParameters);coordinateProof(candidate,a.externalParameters,confirmed);const checked=evaluateCapturedSketch(candidate,a.externalParameters,confirmed.result.evidence,undefined,confirmed.auxiliary);
 // This check also covers unconstrained, disconnected and unsupported carried
 // geometry: candidate data came exclusively from the original source.
 if(JSON.stringify(candidate.objects)!==JSON.stringify(before.objects))fail('CURRENT_GEOMETRY_MISMATCH','Length-role conversion changed geometry.');
 const rows=resultRows(candidate,a.externalParameters,confirmed),measurement=rows.find(r=>r.segmentId===prepared.segment.id&&r.measurementId===(prepared.removedRuler?null:prepared.ruler.id));if(!measurement||measurement.role!==prepared.role||measurement.reason)fail('ADMISSION_CHANGED','The actual ruler/driver did not acquire its requested role.');
 return captureLengthMeasurementReply({revision:a.revision,ok:true,changed:true,serializedSketch:text(candidate),evidence:checked.evidence,measurements:rows,measurement},a.revision);
 }catch(e){return failure(revision,e);}}
// Bind receipt metadata to the independent original-request reconstruction,
// not merely to another row in the first Worker's own response. Solver
// residual arrays are validated normally and are not compared bit-for-bit.
export function verifyLengthMeasurement(request:any){const revision=typeof request?.revision==='string'?request.revision:'';try{const a=captureLengthMeasurementRequest(request,true),{candidateJSON,measurements,measurement,...input}=a,expected=changeLengthMeasurement(input);if(!expected.ok)return expected;if(expected.serializedSketch!==candidateJSON)fail('CANDIDATE_MISMATCH','The exact original length-role request reconstructs a different candidate.');if(JSON.stringify(expected.measurements)!==JSON.stringify(measurements)||JSON.stringify(expected.measurement)!==JSON.stringify(measurement))fail('MEASUREMENT_MISMATCH','The ruler identity, role, canonical value or current driver metadata differs from independent reconstruction.');return{revision:a.revision,ok:true as const,verified:true};}catch(e){return failure(revision,e);}}

// Only genuine generated-pattern ruler insertion/removal is added to travel.
// Classification is derived from actual decoded endpoint objects, not ID syntax.
export function patternReferenceMeasurementDelta(before:any,after:any,external:any){
 if(JSON.stringify(before.dimensions)===JSON.stringify(after.dimensions))return null;const insert=after.dimensions.length===before.dimensions.length+1,remove=before.dimensions.length===after.dimensions.length+1;if(!insert&&!remove)return null;const large=insert?after:before,small=insert?before:after;let at=0;while(at<small.dimensions.length&&JSON.stringify(large.dimensions[at])===JSON.stringify(small.dimensions[at]))at++;const row=large.dimensions[at];if(row?.type!=='LinearDimension')return null;
 const w=new HeadlessSketchWorkspace(external);return w.io.evaluateCapturedSketch(structuredClone(large),()=>{const ruler=w.dimLayer.objects.find(d=>d.id===row.id);if(!ruler||ruler.a?.parent!==ruler.b?.parent||!patternReferenceSegment(w,ruler.a?.parent))return null;return{large,small,row};});
}
export function verifyPatternReferenceMeasurementTravel(request:any){const revision=typeof request?.revision==='string'?request.revision:'';try{
 const keys=['revision','sketchJSON','candidateJSON','externalParameters'];if(!request||!revision||revision.length>256||Reflect.ownKeys(request).length!==keys.length||keys.some(k=>!Object.getOwnPropertyDescriptor(request,k)?.enumerable||!Object.hasOwn(Object.getOwnPropertyDescriptor(request,k),'value'))||[request.sketchJSON,request.candidateJSON].some(s=>typeof s!=='string'||s.length>1048576||new TextEncoder().encode(s).byteLength>1048576))fail('INVALID_CANDIDATE','Invalid native reference travel pair.');const delta=patternReferenceMeasurementDelta(JSON.parse(request.sketchJSON),JSON.parse(request.candidateJSON),request.externalParameters);if(!delta)fail('INTENT_CHANGED','Travel is not one actual generated-pattern reference ruler.');const result=changeLengthMeasurement({revision,sketchJSON:JSON.stringify(delta.large),externalParameters:request.externalParameters,intent:{action:'remove',measurementId:delta.row.id},allocatedId:null});if(!result.ok)return result;if(result.serializedSketch!==JSON.stringify(delta.small))fail('INTENT_CHANGED','Reference ruler travel differs from original native removal.');return{revision,ok:true as const,verified:true};
 }catch(e){return failure(revision,e);}}
