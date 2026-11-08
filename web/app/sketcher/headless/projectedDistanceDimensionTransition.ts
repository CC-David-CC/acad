import {HeadlessSketchWorkspace} from './workspace';
import {solveSketch} from './solve';
import {evaluateCapturedSketch} from './capturedSketchEvaluation';
import {assertVerifiedReplayGeometry} from './verifiedReplayGeometry';
import {captureConnectedGeometryScope,applyCapturedGeometry,assertCapturedGeometryScope,firstCapturedGeometryDifference as difference} from './capturedGeometryScope';
import {projectRenderSketch} from './renderSketchProjection.mjs';
import {AlgNumConstraint,ConstraintDefinitions} from '../constr/ANConstraints';
import {projectedDirectionValid} from '../constr/projectedDistanceDomain.mjs';
import {captureDrivingDimensionIntent,resolveDrivingDimension,drivingDimensionValueValid} from './drivingDimensionTarget.mjs';
import {validateConstraintGeometry} from './sketchValidation';
import {withAdmissionCause,failureCause} from '../constr/admissionCause.mjs';
const MAX=1048576,encoder=new TextEncoder();
const fail=(code:string,message:string):never=>{throw Object.assign(Error(message),{code});};
function record(value:any,keys:string[]){if(!value||typeof value!=='object'||Array.isArray(value)||![null,Object.prototype].includes(Object.getPrototypeOf(value))||Reflect.ownKeys(value).length!==keys.length)fail('INVALID','Expected exact projected-distance fields.');const out:any=Object.create(null);for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('INVALID','Projected-distance fields must be own data.');out[key]=d.value;}return out;}
function bounded(value:any){if(typeof value!=='string'||value.length>MAX||encoder.encode(value).byteLength>MAX)fail('LIMIT','Projected-distance source exceeds1MiB.');return value;}
function external(value:any){if(!value||typeof value!=='object'||Array.isArray(value)||Reflect.ownKeys(value).length>1024)fail('INVALID','Invalid projected-distance bindings.');const out=record(value,Reflect.ownKeys(value) as string[]);for(const key of Reflect.ownKeys(out))if(typeof key!=='string'||!key||key.length>256||typeof out[key]!=='number'||!Number.isFinite(out[key])||Math.abs(out[key])>1e9)fail('INVALID','Invalid projected-distance binding.');return out;}
function capture(request:any){const a=record(request,['revision','sketchJSON','externalParameters','action','intent']);if(typeof a.revision!=='string'||!a.revision||a.revision.length>256||!['edit','remove'].includes(a.action))fail('INVALID','Invalid projected-distance revision/action.');a.sketchJSON=bounded(a.sketchJSON);a.externalParameters=external(a.externalParameters);a.intent=captureDrivingDimensionIntent(a.intent,a.action);return a;}
function revisionOf(value:any){const d=value&&Object.getOwnPropertyDescriptor(value,'revision');return d&&Object.hasOwn(d,'value')&&typeof d.value==='string'?d.value.slice(0,256):'';}
function outcome(revision:string,error:any){const cause=failureCause(error);return{revision,ok:false as const,error:{code:typeof error?.code==='string'?error.code.slice(0,64):'PROJECTED_DISTANCE_FAILED',message:typeof error?.message==='string'?error.message.slice(0,512):'Projected-distance change failed.',...(cause?{cause}:{})}};}
function points(sketch:any){return projectRenderSketch({...sketch,objects:sketch.objects.filter(o=>['Point','Segment','Circle','Arc'].includes(o.type))}).objects.flatMap(o=>o.handles);}
function target(sketch:any,id:string){const row=resolveDrivingDimension(sketch,id,points(sketch));if(row.typeId!=='ProjectedDistance'||row.objects.length!==3)fail('INVALID_TARGET','Choose a discovered live three-reference ProjectedDistance.');return row;}
function cold(revision:string,sketch:any,bindings:any){let auxiliary:any;const result=solveSketch({revision,sketch:structuredClone(sketch),boundary:structuredClone(sketch.boundary),externalParameters:bindings},undefined,batch=>auxiliary=batch);if(!result.ok)throw withAdmissionCause(Object.assign(Error(result.error.message),{code:result.error.code}),result.error.cause);return{result,auxiliary};}
function verified(before:any,after:any,evidence:any[],bindings:any){try{assertVerifiedReplayGeometry(before,after,evidence,bindings);}catch(error){throw withAdmissionCause(Object.assign(Error((String(error?.message||'Projected replay failed.')+' '+difference(before,after)).slice(0,512)),{code:error?.code||'CURRENT_GEOMETRY_MISMATCH'}),failureCause(error));}}
function withoutAdmission(sketch:any){return{...sketch,stages:sketch.stages.map(stage=>({...stage,constraints:stage.constraints.map(c=>{const row={...c};delete row.admission;return row;})}))};}
function classifications(candidate:any,rows:any[]){let index=0;for(const stage of candidate.stages)for(const c of stage.constraints){const row=rows[index++];if(!row||row.typeId!==c.typeId||!['accepted','redundant'].includes(row.state))fail('ADMISSION_CHANGED','Projected-distance admission membership changed.');c.admission={version:1,state:row.state};}if(index!==rows.length)fail('ADMISSION_CHANGED','Projected-distance evidence membership changed.');}

// Source coordinates remain authoritative. Real cold solves provide evidence;
// only the original owned-polynomial connected component can supply a delta.
export function changeProjectedDistanceDimension(request:any){const revision=revisionOf(request);try{
 const a=capture(request),before=JSON.parse(a.sketchJSON),bindings=a.externalParameters,original=cold(a.revision,before,bindings);
 verified(before,original.result.sketch,original.result.evidence,bindings);const originalChecked=evaluateCapturedSketch(before,bindings,original.result.evidence,undefined,original.auxiliary);
 const row=target(before,a.intent.constraintId);let resolved:number=null;
 if(a.action==='edit'){
  if(typeof row.rawValue==='string'&&/^[A-Za-z_$][A-Za-z0-9_$]{0,127}$/.test(row.rawValue.trim())&&typeof a.intent.value==='number')fail('BOUND_DIMENSION','A named projected distance cannot be silently replaced by a literal. Edit its parameter or use a named binding.');
  resolved=typeof a.intent.value==='number'?a.intent.value:bindings[a.intent.value];if(!drivingDimensionValueValid('ProjectedDistance',resolved))fail('INVALID_VALUE','Use a current typed length or signed canonical millimeters within plus or minus1,000,000.');
  if(String(row.rawValue)===String(a.intent.value))return{revision:a.revision,ok:true as const,changed:false,serializedSketch:a.sketchJSON,evidence:original.result.evidence,dimension:{constraintId:a.intent.constraintId,action:a.action,typeId:'ProjectedDistance',objects:[...row.objects],rawValue:row.rawValue,resolvedValue:row.resolvedValue,status:originalChecked.evidence[before.stages.slice(0,row.stage).reduce((n,s)=>n+s.constraints.length,0)+row.index].state}};
 }
 const scope=captureConnectedGeometryScope(before,bindings,original.result.evidence,original.auxiliary,(_workspace,pm,index)=>{
  const c=pm.stages[row.stage]?.solverSystem.allConstraints.filter(c=>!c.internal)[row.index];
  if(!c||c.schema!==ConstraintDefinitions.ProjectedDistance||c.objects.length!==3||c.objects.some((o,i)=>o!==index[row.objects[i]])||!projectedDirectionValid(c.objects[2]))fail('INVALID_TARGET','The actual projected constraint/direction owner changed.');
  let originalSatisfied=true;const equations=[];
  if(a.action==='edit'){
   const proposed=new AlgNumConstraint(ConstraintDefinitions.ProjectedDistance,[...c.objects],{distance:String(a.intent.value)});proposed.resolveConstants(pm.constantResolver);
   try{validateConstraintGeometry(proposed);}catch(error){if(error?.code!=='RESIDUAL')throw error;originalSatisfied=false;}proposed.collectPolynomials(equations);
  }else c.collectPolynomials(equations);
  return{equations,value:{originalSatisfied}};
 },'Projected distance');
 const expected=structuredClone(before),workspace=new HeadlessSketchWorkspace(bindings);workspace.io._loadSketch(structuredClone(before),{strict:true});
 const pm=workspace.parametricManager,index=workspace.createIndex(),c=pm.stages[row.stage]?.solverSystem.allConstraints.filter(c=>!c.internal)[row.index];
 if(!c||c.schema!==ConstraintDefinitions.ProjectedDistance||c.objects.length!==3||c.objects.some((o,i)=>o!==index[row.objects[i]])||!projectedDirectionValid(c.objects[2]))fail('INVALID_TARGET','Projected-distance membership or live direction changed.');
 const direction=c.objects[2];
 if(a.action==='edit')c.validateCandidateConstants({...c.constants,distance:String(a.intent.value)},pm.constantResolver);
 pm.startTransaction();try{
  if(a.action==='edit'){c.updateConstant('distance',String(a.intent.value));expected.stages[row.stage].constraints[row.index].constants.distance=String(a.intent.value);}else{pm._removeConstraint(c);expected.stages[row.stage].constraints.splice(row.index,1);}
  pm.finishTransaction(stages=>{
   if(!projectedDirectionValid(direction))fail('PROJECTED_DIRECTION_DOMAIN','The live projection direction became degenerate or inconsistent.');
   for(const stage of stages)for(const retained of stage.solverSystem.allConstraints){const sys=stage.solverSystem;if(sys.conflicting.has(retained)&&!sys.redundant.has(retained))throw withAdmissionCause(Object.assign(Error('Projected-distance change was rejected by actual sketch admission.'),{code:'DIMENSION_REJECTED'}),sys.getAdmissionCause(retained));}
  },false);
 }catch(error){if(pm.inTransaction)try{pm.finishTransaction(()=>{throw error},false);}catch{}throw error;}
 const warm=JSON.parse(workspace.io.serializeSketch(before.metadata,{strict:true}));warm.boundary=structuredClone(before.boundary);
 const restored={...warm,objects:warm.objects.map((o,i)=>({...o,data:before.objects[i]?.data}))};
 if(difference(withoutAdmission(expected),withoutAdmission(restored))!=='no difference')fail('INTENT_CHANGED','Projected-distance admission changed other authored intent: '+difference(withoutAdmission(expected),withoutAdmission(restored)));
 const candidate=expected;candidate.objects=applyCapturedGeometry(before,warm,scope.fields,a.action==='edit'&&!scope.selection.originalSatisfied,'Projected distance');assertCapturedGeometryScope(before,candidate,scope.fields,'Projected distance');
 classifications(candidate,warm.stages.flatMap(s=>s.constraints.map(c=>({typeId:c.typeId,state:c.admission?.state}))));
 const first=cold(a.revision,candidate,bindings);verified(candidate,first.result.sketch,first.result.evidence,bindings);classifications(candidate,first.result.evidence);
 const second=cold(a.revision,first.result.sketch,bindings);verified(first.result.sketch,second.result.sketch,second.result.evidence,bindings);verified(candidate,second.result.sketch,second.result.evidence,bindings);
 if(first.result.evidence.length!==second.result.evidence.length||first.result.evidence.some((r,i)=>r.typeId!==second.result.evidence[i].typeId||r.state!==second.result.evidence[i].state))fail('ADMISSION_CHANGED','Projected-distance classification was not independently stable.');
 const checked=evaluateCapturedSketch(candidate,bindings,first.result.evidence,undefined,first.auxiliary),at=candidate.stages.slice(0,row.stage).reduce((n,s)=>n+s.constraints.length,0)+row.index,status=a.action==='remove'?'removed':checked.evidence[at]?.state;
 if(a.action!=='remove'&&(!['accepted','redundant'].includes(status)||checked.evidence[at]?.typeId!=='ProjectedDistance'))fail('ADMISSION_CHANGED','Projected-distance row lacks fresh final admission.');
 const actual=a.action==='remove'?null:target(candidate,a.intent.constraintId);if(actual&&Math.abs(actual.resolvedValue-resolved)>1e-6)fail('RESIDUAL','Edited projected distance differs from actual directed source geometry.');
 const serializedSketch=bounded(JSON.stringify(candidate));
 return{revision:a.revision,ok:true as const,changed:serializedSketch!==a.sketchJSON,serializedSketch,evidence:checked.evidence,dimension:{constraintId:a.intent.constraintId,action:a.action,typeId:'ProjectedDistance',objects:[...row.objects],rawValue:actual?.rawValue??null,resolvedValue:actual?.resolvedValue??null,status}};
 }catch(error){return outcome(revision,error);}}

// Independent original-request reconstruction in a SECOND real Worker binds
// source AND final public metadata, not just candidate self-consistency.
export function verifyProjectedDistanceDimensionCandidate(request:any){const revision=revisionOf(request);try{
 const a=record(request,['revision','sketchJSON','externalParameters','action','intent','candidateJSON','dimension']),expected=changeProjectedDistanceDimension({revision:a.revision,sketchJSON:a.sketchJSON,externalParameters:a.externalParameters,action:a.action,intent:a.intent});
 if(!expected.ok)return expected;if(expected.serializedSketch!==bounded(a.candidateJSON))fail('CANDIDATE_MISMATCH','Independent projected-distance source differs: '+difference(JSON.parse(expected.serializedSketch),JSON.parse(a.candidateJSON)));
 const dimension=record(a.dimension,['constraintId','action','typeId','objects','rawValue','resolvedValue','status']);if(difference(expected.dimension,dimension)!=='no difference')fail('ADMISSION_CHANGED','Independent projected-distance receipt differs.');
 return{revision:a.revision,ok:true as const,verified:true};
 }catch(error){return outcome(revision,error);}}
