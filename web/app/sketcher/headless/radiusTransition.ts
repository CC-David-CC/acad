import {HeadlessSketchWorkspace} from './workspace';
import {solveSketch} from './solve';
import {evaluateCapturedSketch} from './capturedSketchEvaluation';
import {assertVerifiedReplayGeometry} from './verifiedReplayGeometry';
import {captureConnectedGeometryScope,applyCapturedGeometry,assertCapturedGeometryScope,firstCapturedGeometryDifference as difference} from './capturedGeometryScope';
import {prepareRadius} from '../actions/radiusAdmission';
import {AlgNumConstraint,ConstraintDefinitions} from '../constr/ANConstraints';
import {Circle} from '../shapes/circle';
import {Arc} from '../shapes/arc';
import {isInstanceOf} from '../actions/matchUtils';
import {validateConstraintGeometry} from './sketchValidation';
import {resolveDrivingDimension,captureDrivingDimensionIntent} from './drivingDimensionTarget.mjs';
import {withAdmissionCause,failureCause} from '../constr/admissionCause.mjs';
const MAX=1048576,encoder=new TextEncoder(),fail=(code:string,message:string):never=>{throw Object.assign(Error(message),{code});};
function record(v:any,keys:string[]){if(!v||typeof v!=='object'||Array.isArray(v)||![null,Object.prototype].includes(Object.getPrototypeOf(v))||Reflect.ownKeys(v).length!==keys.length)fail('INVALID','Expected exact radius fields.');const out:any=Object.create(null);for(const k of keys){const d=Object.getOwnPropertyDescriptor(v,k);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('INVALID','Radius fields must be own data.');out[k]=d.value;}return out;}
function bounded(v:any){if(typeof v!=='string'||v.length>MAX||encoder.encode(v).byteLength>MAX)fail('LIMIT','Radius source exceeds1MiB.');return v;}
function external(v:any){if(!v||typeof v!=='object'||Reflect.ownKeys(v).length>1024)fail('INVALID','Invalid radius parameters.');const out=record(v,Reflect.ownKeys(v) as string[]);for(const k of Reflect.ownKeys(out))if(typeof k!=='string'||!k||k.length>256||typeof out[k]!=='number'||!Number.isFinite(out[k])||Math.abs(out[k])>1e9)fail('INVALID','Invalid radius parameter.');return out;}
function capture(request:any,action:string,verify=false){const a=record(request,verify?['revision','sketchJSON','externalParameters','intent','candidateJSON','dimension']:['revision','sketchJSON','externalParameters','intent']);if(typeof a.revision!=='string'||!a.revision||a.revision.length>256)fail('INVALID','Invalid radius revision.');a.sketchJSON=bounded(a.sketchJSON);a.externalParameters=external(a.externalParameters);
 if(action==='create'){a.intent=record(a.intent,['id','radius']);if(typeof a.intent.id!=='string'||!a.intent.id||a.intent.id.length>256||!positive(a.intent.radius))fail('INVALID','Use a current Circle or Arc and positive radius at most1,000,000mm.');}
 else a.intent=captureDrivingDimensionIntent(a.intent,action);
 if(verify){a.candidateJSON=bounded(a.candidateJSON);const d=record(a.dimension,['id','typeId','radius','status']);if(d.id!==a.intent.id||d.typeId!=='RadiusLength'||d.radius!==a.intent.radius||!['accepted','redundant'].includes(d.status))fail('INVALID_CANDIDATE','Radius receipt differs from original request.');a.dimension=d;}return a;}
const positive=(v:any)=>typeof v==='number'&&Number.isFinite(v)&&v>0&&v<=1e6;
function outcome(revision:string,e:any){const cause=failureCause(e);return{revision,ok:false as const,error:{code:typeof e?.code==='string'?e.code.slice(0,64):'RADIUS_FAILED',message:typeof e?.message==='string'?e.message.slice(0,512):'Radius change failed.',...(cause?{cause}:{})}};}
function revisionOf(v:any){const d=v&&Object.getOwnPropertyDescriptor(v,'revision');return d&&Object.hasOwn(d,'value')&&typeof d.value==='string'?d.value.slice(0,256):'';}
function cold(revision:string,sketch:any,bindings:any){let auxiliary:any;const result=solveSketch({revision,sketch:structuredClone(sketch),boundary:structuredClone(sketch.boundary),externalParameters:bindings},undefined,batch=>auxiliary=batch);if(!result.ok)throw withAdmissionCause(Object.assign(Error(result.error.message),{code:result.error.code}),result.error.cause);return{result,auxiliary};}
function verified(before:any,after:any,rows:any[],bindings:any){try{assertVerifiedReplayGeometry(before,after,rows,bindings);}catch(e){throw withAdmissionCause(Object.assign(Error((String(e?.message||'Radius replay failed.')+' '+difference(before,after)).slice(0,512)),{code:e?.code||'CURRENT_GEOMETRY_MISMATCH'}),failureCause(e));}}
function withoutAdmission(s:any){return{...s,stages:s.stages.map(stage=>({...stage,constraints:stage.constraints.map(c=>{const x={...c};delete x.admission;return x;})}))};}
function copyClassifications(candidate:any,rows:any[]){let i=0;for(const s of candidate.stages)for(const c of s.constraints){const row=rows[i++];if(!row||row.typeId!==c.typeId||!['accepted','redundant'].includes(row.state))fail('ADMISSION_CHANGED','Radius classification membership changed.');c.admission={version:1,state:row.state};}if(i!==rows.length)fail('ADMISSION_CHANGED','Radius evidence membership changed.');}

// Both construction and edit/removal own the ORIGINAL captured source. The
// affected fields come only from its real original polynomials/owned Params.
// Cold solve output is evidence; it never authorizes unrelated publication.
function change(request:any,action:'create'|'edit'|'remove'){
 const revision=revisionOf(request);try{const a=capture(request,action),before=JSON.parse(a.sketchJSON),bindings=a.externalParameters;
 const original=cold(a.revision,before,bindings);verified(before,original.result.sketch,original.result.evidence,bindings);evaluateCapturedSketch(before,bindings,original.result.evidence,undefined,original.auxiliary);
 const target=action==='create'?null:resolveDrivingDimension(before,a.intent.constraintId);
 if(target&&target.typeId!=='RadiusLength')fail('INVALID_TARGET','Choose a discovered RadiusLength.');
 // Creation stays the existing numeric human/shared operation. An edit may
 // persist a genuine named length, resolved only from the captured current
 // dimensional facade by the coordinator; no raw literal replaces that name.
 if(target&&typeof target.rawValue==='string'&&/^[A-Za-z_$][A-Za-z0-9_$]{0,127}$/.test(target.rawValue.trim())&&(action==='remove'||typeof a.intent.value==='number'))fail('BOUND_DIMENSION','A named radius is preserved; edit its parameter or submit a named replacement, not a literal/removal.');
 const id=target?target.objects[0]:a.intent.id,raw=action==='create'?a.intent.radius:action==='edit'?a.intent.value:null,value=typeof raw==='number'?raw:typeof raw==='string'?bindings[raw]:null;
 if(action!=='remove'&&!positive(value))fail('INVALID_VALUE','Radius must be a current positive finite typed length or literal millimeters at most1,000,000.');
 const scope=captureConnectedGeometryScope(before,bindings,original.result.evidence,original.auxiliary,(_workspace,pm,index)=>{
  const object=index[id];if(!(isInstanceOf(object,Circle)||isInstanceOf(object,Arc))||!object.stage||!pm.stages.includes(object.stage)||object.generator&&object.stage===pm.stage)fail('INVALID_TARGET','Choose a current owned Circle or Arc.');
  if(target&&object.stage.index>target.stage)fail('INVALID_TARGET','Radius stage ownership changed.');
  let originalSatisfied=true;const equations=[];
  if(action!=='remove'){const proposed=new AlgNumConstraint(ConstraintDefinitions.RadiusLength,[object],{length:String(raw)});proposed.resolveConstants(pm.constantResolver);try{validateConstraintGeometry(proposed);}catch(e){if(e?.code!=='RESIDUAL')throw e;originalSatisfied=false;}proposed.collectPolynomials(equations);}
  return{equations,value:{originalSatisfied,stage:target?target.stage:object.stage.index}};
 },'Radius');
 const expected=structuredClone(before),stage=scope.selection.stage;let indexInStage:number;
 const workspace=new HeadlessSketchWorkspace(bindings);workspace.io._loadSketch(structuredClone(before),{strict:true});const pm=workspace.parametricManager,index=workspace.createIndex(),object=index[id];let constraint:any;
 if(action==='create'){const prepared=prepareRadius(pm,object,String(value));constraint=prepared.constraint;indexInStage=before.stages[stage].constraints.length;
  pm.startTransaction();try{pm._add(constraint);pm.finishTransaction(prepared.validate,false);}catch(e){if(pm.inTransaction)try{pm.finishTransaction(()=>{throw e},false);}catch{}throw e;}
  if(constraint.stage?.index!==stage||constraint.stage.solverSystem.allConstraints.filter(c=>!c.internal).indexOf(constraint)!==indexInStage)fail('INTENT_CHANGED','The radius was not appended at its real authored stage.');
  const row=constraint.write();if(row.typeId!=='RadiusLength'||row.stage!==stage||JSON.stringify(row.objects)!==JSON.stringify([id])||Object.keys(row.constants).join(',')!=='length'||row.constants.length!==String(value))fail('INTENT_CHANGED','Radius intent changed during admission.');expected.stages[stage].constraints.push(row);
 }else{indexInStage=target.index;constraint=pm.stages[stage]?.solverSystem.allConstraints.filter(c=>!c.internal)[indexInStage];if(!constraint||constraint.schema!==ConstraintDefinitions.RadiusLength||constraint.objects.length!==1||constraint.objects[0]!==object)fail('INVALID_TARGET','Radius constraint ownership changed.');
  if(action==='edit')constraint.validateCandidateConstants({...constraint.constants,length:String(raw)},pm.constantResolver);
  pm.startTransaction();try{if(action==='edit'){constraint.updateConstant('length',String(raw));expected.stages[stage].constraints[indexInStage].constants.length=String(raw);}else{pm._removeConstraint(constraint);expected.stages[stage].constraints.splice(indexInStage,1);}pm.finishTransaction(stages=>{for(const s of stages)for(const c of s.solverSystem.allConstraints){const sys=s.solverSystem;if(sys.conflicting.has(c)&&!sys.redundant.has(c))throw withAdmissionCause(Object.assign(Error('Radius change was rejected by actual sketch admission.'),{code:'DIMENSION_REJECTED'}),sys.getAdmissionCause(c));}},false);}catch(e){if(pm.inTransaction)try{pm.finishTransaction(()=>{throw e},false);}catch{}throw e;}}
 const warm=JSON.parse(workspace.io.serializeSketch(before.metadata,{strict:true}));warm.boundary=structuredClone(before.boundary);
 const restored={...warm,objects:warm.objects.map((o,i)=>({...o,data:before.objects[i]?.data}))};if(difference(withoutAdmission(expected),withoutAdmission(restored))!=='no difference')fail('INTENT_CHANGED','Radius admission changed retained intent: '+difference(withoutAdmission(expected),withoutAdmission(restored)));
 const candidate=expected;candidate.objects=applyCapturedGeometry(before,warm,scope.fields,!scope.selection.originalSatisfied,'Radius');assertCapturedGeometryScope(before,candidate,scope.fields,'Radius');
 // Classification changes on removal (including reactivated redundant rows)
 // derive from fresh admission, not copied saved status hints.
 copyClassifications(candidate,warm.stages.flatMap(s=>s.constraints.map(c=>({typeId:c.typeId,state:c.admission?.state}))));
 const first=cold(a.revision,candidate,bindings);verified(candidate,first.result.sketch,first.result.evidence,bindings);copyClassifications(candidate,first.result.evidence);
 const second=cold(a.revision,first.result.sketch,bindings);verified(first.result.sketch,second.result.sketch,second.result.evidence,bindings);verified(candidate,second.result.sketch,second.result.evidence,bindings);
 if(first.result.evidence.length!==second.result.evidence.length||first.result.evidence.some((r,i)=>r.typeId!==second.result.evidence[i].typeId||r.state!==second.result.evidence[i].state))fail('ADMISSION_CHANGED','Radius classifications are not independently stable.');
 const checked=evaluateCapturedSketch(candidate,bindings,first.result.evidence,undefined,first.auxiliary),at=candidate.stages.slice(0,stage).reduce((n,s)=>n+s.constraints.length,0)+indexInStage;
 const status=action==='remove'?'removed':checked.evidence[at]?.state;if(action!=='remove'&&(!['accepted','redundant'].includes(status)||checked.evidence[at]?.typeId!=='RadiusLength'))fail('ADMISSION_CHANGED','Radius lacks fresh actual admission evidence.');
 const serializedSketch=bounded(JSON.stringify(candidate));
 if(action==='create')return{revision:a.revision,ok:true as const,serializedSketch,evidence:checked.evidence,dimension:{id,typeId:'RadiusLength',radius:value,status}};
 const actual=action==='remove'?null:resolveDrivingDimension(candidate,a.intent.constraintId);
 return{revision:a.revision,ok:true as const,changed:serializedSketch!==a.sketchJSON,serializedSketch,evidence:checked.evidence,dimension:{constraintId:a.intent.constraintId,action,typeId:'RadiusLength',objects:[id],rawValue:actual?.rawValue??null,resolvedValue:actual?.resolvedValue??null,status}};
 }catch(e){return outcome(revision,e);}}
export const addRadiusTransition=(request:any)=>change(request,'create');
export const changeRadiusDimension=(request:any,action:'edit'|'remove')=>change(request,action);

// A SECOND real Worker repeats original request + actual source admission;
// candidate geometry and public metadata must both match that reconstruction.
export function verifyRadiusCandidate(request:any){const revision=revisionOf(request);try{const a=capture(request,'create',true),expected=addRadiusTransition({revision:a.revision,sketchJSON:a.sketchJSON,externalParameters:a.externalParameters,intent:a.intent});if(!expected.ok)return expected;if(expected.serializedSketch!==a.candidateJSON)fail('CANDIDATE_MISMATCH','Independent radius source differs: '+difference(JSON.parse(expected.serializedSketch),JSON.parse(a.candidateJSON)));if(difference(expected.dimension,a.dimension)!=='no difference')fail('ADMISSION_CHANGED','Independent radius receipt differs.');return{revision:a.revision,ok:true as const,verified:true};}catch(e){return outcome(revision,e);}}
export function verifyRadiusDimensionCandidate(request:any){const revision=revisionOf(request);try{const a=record(request,['revision','sketchJSON','externalParameters','action','intent','candidateJSON','dimension']);if(!['edit','remove'].includes(a.action))fail('INVALID','Invalid radius dimension action.');const expected=changeRadiusDimension({revision:a.revision,sketchJSON:a.sketchJSON,externalParameters:a.externalParameters,intent:a.intent},a.action);if(!expected.ok)return expected;if(expected.serializedSketch!==bounded(a.candidateJSON))fail('CANDIDATE_MISMATCH','Independent radius edit source differs: '+difference(JSON.parse(expected.serializedSketch),JSON.parse(a.candidateJSON)));const d=record(a.dimension,['constraintId','action','typeId','objects','rawValue','resolvedValue','status']);if(difference(expected.dimension,d)!=='no difference')fail('ADMISSION_CHANGED','Independent radius dimension receipt differs.');return{revision:a.revision,ok:true as const,verified:true};}catch(e){return outcome(revision,e);}}
