import {HeadlessSketchWorkspace} from './workspace';
import {solveSketch} from './solve';
import {prepareLengthRelation} from '../actions/lengthRelationAdmission';
import {evaluateCapturedSketch} from './capturedSketchEvaluation';
import {assertVerifiedReplayGeometry} from './verifiedReplayGeometry';
import {captureLengthRelationScope,applyLengthRelationGeometry,assertLengthRelationGeometryScope,firstLengthDifference} from './lengthRelationAffectedGeometry';
import {captureAdmissionCause} from '../constr/admissionCause.mjs';
const MAX=1048576,encoder=new TextEncoder(),fail=(code:string,message:string):never=>{throw Object.assign(Error(message),{code});};
function record(v:any,keys:string[]){if(!v||typeof v!=='object'||Array.isArray(v)||![null,Object.prototype].includes(Object.getPrototypeOf(v))||Reflect.ownKeys(v).length!==keys.length)fail('INVALID','Expected exact length-relation fields.');const r:any={};for(const k of keys){const d=Object.getOwnPropertyDescriptor(v,k);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('INVALID','Length-relation fields must be own data.');r[k]=d.value;}return r;}
function dense(v:any,max:number){if(!Array.isArray(v)||v.length>max||Reflect.ownKeys(v).length!==v.length+1)fail('INVALID','Expected a bounded dense array.');return Array.from({length:v.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(v,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('INVALID','Array entries must be own data.');return d.value;});}
function bounded(v:any){if(typeof v!=='string'||v.length>MAX||encoder.encode(v).byteLength>MAX)fail('LIMIT','The length relation source exceeds1MiB.');return v;}
function capture(request:any,verify=false){const a=record(request,verify?['revision','sketchJSON','externalParameters','intent','candidateJSON','relation']:['revision','sketchJSON','externalParameters','intent']);if(typeof a.revision!=='string'||!a.revision||a.revision.length>256)fail('INVALID','Invalid length relation revision.');a.sketchJSON=bounded(a.sketchJSON);a.intent=record(a.intent,['ids','factor','offset']);a.intent.ids=dense(a.intent.ids,2);if(a.intent.ids.length!==2||a.intent.ids.some(id=>typeof id!=='string'||!id||id.length>256)||a.intent.ids[0]===a.intent.ids[1]||typeof a.intent.factor!=='number'||!Number.isFinite(a.intent.factor)||a.intent.factor<0||typeof a.intent.offset!=='number'||!Number.isFinite(a.intent.offset))fail('INVALID','Use two actual Segment IDs, a finite nonnegative scalar factor and finite millimeter offset.');const p=a.externalParameters;if(!p||typeof p!=='object'||Array.isArray(p)||![null,Object.prototype].includes(Object.getPrototypeOf(p))||Reflect.ownKeys(p).length>1024)fail('INVALID','Invalid length relation bindings.');a.externalParameters=record(p,Reflect.ownKeys(p) as string[]);for(const k of Object.keys(a.externalParameters))if(!k||k.length>256||typeof a.externalParameters[k]!=='number'||!Number.isFinite(a.externalParameters[k])||Math.abs(a.externalParameters[k])>1e9)fail('INVALID','Invalid length relation parameter.');if(verify){a.candidateJSON=bounded(a.candidateJSON);a.relation=record(a.relation,['objects','status']);a.relation.objects=dense(a.relation.objects,2);if(a.relation.objects.length!==2||a.relation.objects.some((id,i)=>id!==a.intent.ids[i])||!['accepted','redundant'].includes(a.relation.status))fail('INVALID_CANDIDATE','The relation receipt must match its original request.');}return a;}
function revisionOf(v:any){const d=v&&Object.getOwnPropertyDescriptor(v,'revision');return d&&Object.hasOwn(d,'value')&&typeof d.value==='string'&&d.value.length<=256?d.value:'';}
function outcome(revision:string,e:any){return{revision,ok:false as const,error:{code:typeof e?.code==='string'?e.code.slice(0,64):'LENGTH_RELATION_FAILED',message:typeof e?.message==='string'?e.message.slice(0,512):'Length relation failed.',...(e?.cause?{cause:captureAdmissionCause(e.cause)}:{})}};}
function sameEvidence(a:any[],b:any[]){if(a.length!==b.length||a.some((r,i)=>r.typeId!==b[i].typeId||r.state!==b[i].state))fail('ADMISSION_CHANGED','Length relation cold classifications are not independently stable.');}
function verifyColdGeometry(before:any,after:any,rows:any[],external:any,phase:string){try{assertVerifiedReplayGeometry(before,after,rows,external);}catch(e){throw Object.assign(Error((phase+': '+(e?.message||'Geometry verification failed.')+' First difference: '+firstLengthDifference(before,after)).slice(0,512)),{code:typeof e?.code==='string'?e.code:'CURRENT_GEOMETRY_MISMATCH'});}}

// Private observation callback, supplied only to a genuine successful solve.
// This batch never crosses a Worker/public message or becomes saved geometry.
function coldSolve(revision:string,sketch:any,external:any){let auxiliaryWitnessBatch:any;const result=solveSketch({revision,sketch:structuredClone(sketch),boundary:structuredClone(sketch.boundary),externalParameters:external},undefined,batch=>{auxiliaryWitnessBatch=batch;});return{result,auxiliaryWitnessBatch};}

// The original source plus one actual row and its authenticated component
// delta is authoritative. Warm whole-model output and cold proofs are not.
export function changeLengthRelation(request:any){const revision=revisionOf(request);try{
 const a=capture(request),external=a.externalParameters,before=JSON.parse(a.sketchJSON),original=coldSolve(a.revision,before,external),proof=original.result;if(!proof.ok)return proof;
 verifyColdGeometry(before,proof.sketch,proof.evidence,external,'Original source replay');
 const scope=captureLengthRelationScope(before,external,a.intent,proof.evidence,original.auxiliaryWitnessBatch);
 const workspace=new HeadlessSketchWorkspace(external);workspace.io._loadSketch(structuredClone(before),{strict:true});const pm=workspace.parametricManager,index=workspace.createIndex(),objects=a.intent.ids.map(id=>index[id]),prepared=prepareLengthRelation(pm,objects,{factor:String(a.intent.factor),offset:String(a.intent.offset)}),constraint=prepared.constraint;
 pm.startTransaction();try{pm._add(constraint);pm.finishTransaction(prepared.validate,false);}catch(e){if(pm.inTransaction)try{pm.finishTransaction(()=>{throw e},false);}catch{}throw e;}
 const stage=constraint.stage?.index,indexInStage=constraint.stage?.solverSystem.allConstraints.filter(c=>!c.internal).indexOf(constraint),status=constraint.stage?.solverSystem.redundant.has(constraint)?'redundant':'accepted';
 if(stage!==scope.stage||indexInStage!==before.stages[stage]?.constraints.length)fail('INTENT_CHANGED','The new relation is not appended to its actual authored stage.');
 const row=constraint.write();row.admission={version:1,state:status};
 if(row.typeId!=='LengthRelation'||row.stage!==stage||JSON.stringify(row.objects)!==JSON.stringify(a.intent.ids)||Object.keys(row.constants).sort().join(',')!=='factor,offset'||row.constants.factor!==String(a.intent.factor)||row.constants.offset!==String(a.intent.offset))fail('INTENT_CHANGED','The authored length relation differs from the original request.');
 const warm=JSON.parse(workspace.io.serializeSketch(before.metadata,{strict:true}));warm.boundary=structuredClone(before.boundary);
 const expected=structuredClone(before);expected.stages[stage].constraints.push(structuredClone(row));
 const restored={...warm,objects:warm.objects.map((o,i)=>({...o,data:before.objects[i]?.data}))},intentDifference=firstLengthDifference(expected,restored);
 if(intentDifference!=='no difference')fail('INTENT_CHANGED','Length admission changed retained intent: '+intentDifference);
 // Already-satisfied means original equations REALLY hold. The operation then
 // owns no coordinate change. Otherwise only the proved parameter delta moves.
 const candidate=expected;candidate.objects=applyLengthRelationGeometry(before,warm,scope.fields,!scope.originalSatisfied);assertLengthRelationGeometryScope(before,candidate,scope.fields);
 const coldObservation=coldSolve(a.revision,candidate,external),cold=coldObservation.result;if(!cold.ok)return cold;
 verifyColdGeometry(candidate,cold.sketch,cold.evidence,external,'First cold proof');
 const verified=coldSolve(a.revision,cold.sketch,external).result;if(!verified.ok)return verified;
 verifyColdGeometry(cold.sketch,verified.sketch,verified.evidence,external,'Independent cold replay');verifyColdGeometry(candidate,verified.sketch,verified.evidence,external,'Original candidate bound');sameEvidence(cold.evidence,verified.evidence);
 const checked=evaluateCapturedSketch(candidate,external,cold.evidence,undefined,coldObservation.auxiliaryWitnessBatch),at=candidate.stages.slice(0,stage).reduce((n,s)=>n+s.constraints.length,0)+indexInStage,newEvidence=checked.evidence[at],newRow=candidate.stages[stage].constraints[indexInStage];
 if(!newEvidence||newEvidence.typeId!=='LengthRelation'||newEvidence.state!==newRow.admission.state)fail('ADMISSION_CHANGED','Returned relation status lacks matching fresh candidate evidence.');
 return{revision:a.revision,ok:true as const,serializedSketch:bounded(JSON.stringify(candidate)),evidence:checked.evidence,relation:{objects:[...a.intent.ids],status:newEvidence.state}};
 }catch(e){return outcome(revision,e);}}

// A second real Worker reconstructs the exact original request, not merely a
// candidate that satisfies constraints after unrelated finite edits.
export function verifyLengthRelationCandidate(request:any){const revision=revisionOf(request);try{const a=capture(request,true),expected=changeLengthRelation({revision:a.revision,sketchJSON:a.sketchJSON,externalParameters:a.externalParameters,intent:a.intent});if(!expected.ok)return expected;if(expected.serializedSketch!==a.candidateJSON)fail('CANDIDATE_MISMATCH','Independent length operation differs: '+firstLengthDifference(JSON.parse(expected.serializedSketch),JSON.parse(a.candidateJSON)));if(firstLengthDifference(expected.relation,a.relation)!=='no difference')fail('ADMISSION_CHANGED','The relation receipt differs from independent reconstruction.');return{revision:a.revision,ok:true as const,verified:true};}catch(e){return outcome(revision,e);}}
