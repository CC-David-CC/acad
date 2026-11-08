import {HeadlessSketchWorkspace} from './workspace';
import {solveSketch} from './solve';
import {evaluateCapturedSketch} from './capturedSketchEvaluation';
import {assertVerifiedReplayGeometry} from './verifiedReplayGeometry';
import {capturedParameterOwnership,installCapturedAuxiliaryWitnesses} from './capturedParameterOwnership';
import {inspectLengthMeasurementModel,prepareLengthMeasurement} from '../actions/lengthMeasurementPreparation';
import {captureLengthMeasurementRequest,captureLengthMeasurementReply} from './lengthMeasurementIntent.mjs';
import {failureCause} from '../constr/admissionCause.mjs';
const fail=(code:string,message:string):never=>{throw Object.assign(Error(message),{code});};
const text=(v:any)=>{const s=JSON.stringify(v);if(s.length>1048576||new TextEncoder().encode(s).byteLength>1048576)fail('RESOURCE_LIMIT','Length measurement source exceeds 1MiB.');return s;};
const failure=(revision:string,e:any)=>({revision,ok:false as const,error:{code:typeof e?.code==='string'?e.code.slice(0,64):'MEASUREMENT_INVALID',message:typeof e?.message==='string'?e.message.slice(0,512):'Length measurement failed.',...(failureCause(e)?{cause:failureCause(e)}:{})}});
function cold(revision:string,sketch:any,external:any){let auxiliary:any;const result=solveSketch({revision,sketch:structuredClone(sketch),boundary:structuredClone(sketch.boundary),externalParameters:external},undefined,batch=>{auxiliary=batch;});if(!result.ok)throw Object.assign(Error(result.error.message),{code:result.error.code,admissionCause:result.error.cause});return{result,auxiliary};}
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
 const rows=resultRows(candidate,a.externalParameters,confirmed),measurement=rows.find(r=>r.segmentId===prepared.segment.id&&r.measurementId===prepared.ruler.id);if(!measurement||measurement.role!==prepared.role||measurement.reason)fail('ADMISSION_CHANGED','The actual ruler/driver did not acquire its requested role.');
 return captureLengthMeasurementReply({revision:a.revision,ok:true,changed:true,serializedSketch:text(candidate),evidence:checked.evidence,measurements:rows,measurement},a.revision);
 }catch(e){return failure(revision,e);}}
export function verifyLengthMeasurement(request:any){const revision=typeof request?.revision==='string'?request.revision:'';try{const a=captureLengthMeasurementRequest(request,true),{candidateJSON,...input}=a,expected=changeLengthMeasurement(input);if(!expected.ok)return expected;if(expected.serializedSketch!==candidateJSON)fail('CANDIDATE_MISMATCH','The exact original length-role request reconstructs a different candidate.');return{revision:a.revision,ok:true as const,verified:true};}catch(e){return failure(revision,e);}}
