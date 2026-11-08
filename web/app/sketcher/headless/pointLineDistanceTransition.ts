import {HeadlessSketchWorkspace} from './workspace';
import {solveSketch} from './solve';
import {evaluateCapturedSketch} from './capturedSketchEvaluation';
import {assertVerifiedReplayGeometry} from './verifiedReplayGeometry';
import {captureConnectedGeometryScope,applyCapturedGeometry,assertCapturedGeometryScope,firstCapturedGeometryDifference as difference} from './capturedGeometryScope';
import {preparePointLineDistance,inspectPointLineDistance} from '../actions/pointLineDistanceAdmission';
import {pointLineConstantsValid,pointLineSide,pointLineDistanceValid} from '../constr/pointLineDistanceDomain.mjs';
import {AlgNumConstraint,ConstraintDefinitions} from '../constr/ANConstraints';
import {validateConstraintGeometry} from './sketchValidation';
import {resolveDrivingDimension,captureDrivingDimensionIntent} from './drivingDimensionTarget.mjs';
import {projectRenderSketch} from './renderSketchProjection.mjs';
import {capturePointLineDistanceIntent,pointLineRecord} from './pointLineDistanceEnvelope.mjs';
import {withAdmissionCause,failureCause} from '../constr/admissionCause.mjs';
const MAX=1048576,encoder=new TextEncoder(),fail=(code:string,message:string):never=>{throw Object.assign(Error(message),{code});};
function bounded(v:any){if(typeof v!=='string'||v.length>MAX||encoder.encode(v).byteLength>MAX)fail('LIMIT','Point-line source exceeds1MiB.');return v;}
function external(v:any){if(!v||typeof v!=='object'||Array.isArray(v)||Reflect.ownKeys(v).length>1024)fail('INVALID','Invalid point-line bindings.');const out=pointLineRecord(v,Reflect.ownKeys(v) as string[]);for(const k of Reflect.ownKeys(out))if(typeof k!=='string'||!k||k.length>256||typeof out[k]!=='number'||!Number.isFinite(out[k])||Math.abs(out[k])>1e9)fail('INVALID','Invalid point-line binding.');return out;}
function capture(request:any,action:string){const a=pointLineRecord(request,['revision','sketchJSON','externalParameters','intent']);if(typeof a.revision!=='string'||!a.revision||a.revision.length>256)fail('INVALID','Invalid point-line revision.');a.sketchJSON=bounded(a.sketchJSON);a.externalParameters=external(a.externalParameters);a.intent=action==='create'?capturePointLineDistanceIntent(a.intent):captureDrivingDimensionIntent(a.intent,action);return a;}
function revisionOf(v:any){const d=v&&Object.getOwnPropertyDescriptor(v,'revision');return d&&Object.hasOwn(d,'value')&&typeof d.value==='string'?d.value.slice(0,256):'';}
function outcome(revision:string,error:any){const cause=failureCause(error);return{revision,ok:false as const,error:{code:typeof error?.code==='string'?error.code.slice(0,64):'POINT_LINE_FAILED',message:typeof error?.message==='string'?error.message.slice(0,512):'Point-line transition failed.',...(cause?{cause}:{})}};}
function cold(revision:string,sketch:any,bindings:any){let auxiliary:any;const result=solveSketch({revision,sketch:structuredClone(sketch),boundary:structuredClone(sketch.boundary),externalParameters:bindings},undefined,batch=>auxiliary=batch);if(!result.ok)throw withAdmissionCause(Object.assign(Error(result.error.message),{code:result.error.code}),result.error.cause);return{result,auxiliary};}
function verified(before:any,after:any,rows:any[],bindings:any){try{assertVerifiedReplayGeometry(before,after,rows,bindings);}catch(e){throw withAdmissionCause(Object.assign(Error((String(e?.message||'Point-line replay failed.')+' '+difference(before,after)).slice(0,512)),{code:e?.code||'CURRENT_GEOMETRY_MISMATCH'}),failureCause(e));}}
function withoutAdmission(s:any){return{...s,stages:s.stages.map(stage=>({...stage,constraints:stage.constraints.map(c=>{const x={...c};delete x.admission;return x;})}))};}
function classifications(candidate:any,rows:any[]){let i=0;for(const stage of candidate.stages)for(const c of stage.constraints){const row=rows[i++];if(!row||row.typeId!==c.typeId||!['accepted','redundant'].includes(row.state))fail('ADMISSION_CHANGED','Point-line classification membership changed.');c.admission={version:1,state:row.state};}if(i!==rows.length)fail('ADMISSION_CHANGED','Point-line evidence membership changed.');}
function target(sketch:any,id:string){const points=projectRenderSketch({...sketch,objects:sketch.objects.filter(o=>['Point','Segment','Circle','Arc'].includes(o.type))}).objects.flatMap(o=>o.handles),row=resolveDrivingDimension(sketch,id,points);if(row.typeId!=='DistancePL')fail('INVALID_TARGET','Choose an inspected supporting-line dimension.');return row;}
function rowAt(pm:any,stage:number,index:number,ids:string[],objects:any){const c=pm.stages[stage]?.solverSystem.allConstraints.filter(c=>!c.internal)[index];if(!c||c.schema!==ConstraintDefinitions.DistancePL||c.objects.length!==2||c.objects.some((o,i)=>o!==objects[ids[i]])||!pointLineConstantsValid(c.constants))fail('INVALID_TARGET','The actual point-line row or two-constant authority changed.');return c;}
function inspectFinal(sketch:any,bindings:any,stage:number,at:number){const w=new HeadlessSketchWorkspace(bindings);w.io._loadSketch(structuredClone(sketch),{strict:true});const row=sketch.stages[stage].constraints[at],c=rowAt(w.parametricManager,stage,at,row.objects,w.createIndex());c.resolveConstants(w.parametricManager.constantResolver);validateConstraintGeometry(c);return{c,...inspectPointLineDistance(w.parametricManager,c.objects[0],c.objects[1])};}

// Original source plus actual owned component delta; no optimizer copyback.
function change(request:any,action:'create'|'edit'|'remove'){
 const revision=revisionOf(request);try{
 const a=capture(request,action),before=JSON.parse(a.sketchJSON),bindings=a.externalParameters,original=cold(a.revision,before,bindings);
 verified(before,original.result.sketch,original.result.evidence,bindings);const checkedOriginal=evaluateCapturedSketch(before,bindings,original.result.evidence,undefined,original.auxiliary);
 const old=action==='create'?null:target(before,a.intent.constraintId),ids=old?[...old.objects]:[a.intent.pointId,a.intent.lineId],oldRow=old?before.stages[old.stage].constraints[old.index]:null;
 if(action==='edit'&&typeof old.rawValue==='string'&&/^[A-Za-z_$][A-Za-z0-9_$]{0,127}$/.test(old.rawValue.trim())&&typeof a.intent.value==='number')fail('BOUND_DIMENSION','A named point-line distance cannot be silently replaced by a literal.');
 const raw=action==='create'?a.intent.distance:action==='edit'?a.intent.value:null,value=action==='remove'?null:typeof raw==='number'?raw:bindings[raw],inverted=old?pointLineSide(oldRow.constants.inverted):a.intent.inverted;
 if(action!=='remove'&&(!pointLineDistanceValid(value)||value>1e6))fail('INVALID_VALUE','Use a current nonnegative length at most1,000,000mm.');
 const scope=captureConnectedGeometryScope(before,bindings,original.result.evidence,original.auxiliary,(_w,pm,index)=>{
  const inspected=inspectPointLineDistance(pm,index[ids[0]],index[ids[1]]),stage=old?old.stage:inspected.stage.index;
  if(old){const c=rowAt(pm,stage,old.index,ids,index);c.resolveConstants(pm.constantResolver);validateConstraintGeometry(c);}
  let originalSatisfied=true;const equations=[];
  if(action!=='remove'){const proposed=new AlgNumConstraint(ConstraintDefinitions.DistancePL,[inspected.point,inspected.line],{distance:String(raw),inverted:old?oldRow.constants.inverted:inverted});proposed.resolveConstants(pm.constantResolver);try{validateConstraintGeometry(proposed);}catch(e){if(e?.code!=='RESIDUAL')throw e;originalSatisfied=false;}proposed.collectPolynomials(equations);}
  const generated=[];for(const s of pm.stages)for(const g of s.generators)if(!g.internal)for(const o of g.generatedObjects){if(index[o.id]!==o||o.generator!==g)fail('INVALID_TARGET','Generator ownership changed.');if(generated.length>=10000)fail('LIMIT','Generator output inventory exceeds existing sketch limits.');generated.push(o.id);}
  return{equations,value:{originalSatisfied,stage,generated}};
 },'Point-line distance');
 if(scope.selection.generated.some(id=>(scope.fields.get(id)?.size||0)>0))fail('UNSUPPORTED_TARGET','Moving a generator-dependent component is not supported by this point-line operation.');
 const stage=scope.selection.stage,expected=structuredClone(before),workspace=new HeadlessSketchWorkspace(bindings);workspace.io._loadSketch(structuredClone(before),{strict:true});const pm=workspace.parametricManager,index=workspace.createIndex();let constraint:any,indexInStage:number;
 if(action==='create'){
  const prepared=preparePointLineDistance(pm,index[ids[0]],index[ids[1]],String(value),inverted);constraint=prepared.constraint;
  if(prepared.existing){indexInStage=constraint.stage.solverSystem.allConstraints.filter(c=>!c.internal).indexOf(constraint);const row=before.stages[stage].constraints[indexInStage];constraint.resolveConstants(pm.constantResolver);validateConstraintGeometry(constraint);if(indexInStage<0||!row||!['accepted','redundant'].includes(row.admission?.state))fail('ADMISSION_CHANGED','Existing point-line row is unavailable.');
   return{revision:a.revision,ok:true as const,changed:false,serializedSketch:a.sketchJSON,evidence:checkedOriginal.evidence,dimension:{typeId:'DistancePL',objects:ids,distance:value,inverted,status:row.admission.state,stage,index:indexInStage}};
  }
  indexInStage=before.stages[stage].constraints.length;pm.startTransaction();try{pm._add(constraint);pm.finishTransaction(prepared.validate,false);}catch(e){if(pm.inTransaction)try{pm.finishTransaction(()=>{throw e},false);}catch{}throw e;}
  if(constraint.stage?.index!==stage||constraint.stage.solverSystem.allConstraints.filter(c=>!c.internal).indexOf(constraint)!==indexInStage)fail('INTENT_CHANGED','DistancePL was not appended in its actual authored stage.');
  const row=constraint.write();if(row.typeId!=='DistancePL'||row.stage!==stage||JSON.stringify(row.objects)!==JSON.stringify(ids)||!pointLineConstantsValid(row.constants)||row.constants.distance!==String(value)||row.constants.inverted!==inverted)fail('INTENT_CHANGED','Point-line creation changed its exact request.');expected.stages[stage].constraints.push(row);
 }else{
  indexInStage=old.index;constraint=rowAt(pm,stage,indexInStage,ids,index);
  if(action==='edit'&&String(old.rawValue)===String(raw)){const actual=inspectFinal(before,bindings,stage,indexInStage);return{revision:a.revision,ok:true as const,changed:false,serializedSketch:a.sketchJSON,evidence:checkedOriginal.evidence,dimension:{constraintId:a.intent.constraintId,action,typeId:'DistancePL',objects:ids,rawValue:old.rawValue,resolvedValue:Math.abs(actual.actual.signedDistance),inverted,status:oldRow.admission.state}};}
  if(action==='edit')constraint.validateCandidateConstants({...constraint.constants,distance:String(raw)},pm.constantResolver);
  pm.startTransaction();try{if(action==='edit'){constraint.updateConstant('distance',String(raw));expected.stages[stage].constraints[indexInStage].constants.distance=String(raw);}else{pm._removeConstraint(constraint);expected.stages[stage].constraints.splice(indexInStage,1);}
   pm.finishTransaction(stages=>{for(const s of stages)for(const c of s.solverSystem.allConstraints){const sys=s.solverSystem;if(sys.conflicting.has(c)&&!sys.redundant.has(c))throw withAdmissionCause(Object.assign(Error('Point-line change was rejected by actual sketch admission.'),{code:'DIMENSION_REJECTED'}),sys.getAdmissionCause(c));}},false);
  }catch(e){if(pm.inTransaction)try{pm.finishTransaction(()=>{throw e},false);}catch{}throw e;}
 }
 const warm=JSON.parse(workspace.io.serializeSketch(before.metadata,{strict:true}));warm.boundary=structuredClone(before.boundary);const restored={...warm,objects:warm.objects.map((o,i)=>({...o,data:before.objects[i]?.data}))};
 if(difference(withoutAdmission(expected),withoutAdmission(restored))!=='no difference')fail('INTENT_CHANGED','Point-line admission changed retained intent: '+difference(withoutAdmission(expected),withoutAdmission(restored)));
 const candidate=expected;candidate.objects=applyCapturedGeometry(before,warm,scope.fields,action!=='remove'&&!scope.selection.originalSatisfied,'Point-line distance');assertCapturedGeometryScope(before,candidate,scope.fields,'Point-line distance');
 classifications(candidate,warm.stages.flatMap(s=>s.constraints.map(c=>({typeId:c.typeId,state:c.admission?.state}))));
 const first=cold(a.revision,candidate,bindings);verified(candidate,first.result.sketch,first.result.evidence,bindings);classifications(candidate,first.result.evidence);
 const second=cold(a.revision,first.result.sketch,bindings);verified(first.result.sketch,second.result.sketch,second.result.evidence,bindings);verified(candidate,second.result.sketch,second.result.evidence,bindings);
 if(first.result.evidence.length!==second.result.evidence.length||first.result.evidence.some((r,i)=>r.typeId!==second.result.evidence[i].typeId||r.state!==second.result.evidence[i].state))fail('ADMISSION_CHANGED','Point-line classifications are not independently stable.');
 const checked=evaluateCapturedSketch(candidate,bindings,first.result.evidence,undefined,first.auxiliary),at=candidate.stages.slice(0,stage).reduce((n,s)=>n+s.constraints.length,0)+indexInStage,status=action==='remove'?'removed':checked.evidence[at]?.state;
 if(action!=='remove'&&(!['accepted','redundant'].includes(status)||checked.evidence[at]?.typeId!=='DistancePL'))fail('ADMISSION_CHANGED','Point-line lacks fresh actual admission.');
 let actual:any=null;if(action!=='remove'){actual=inspectFinal(candidate,bindings,stage,indexInStage);if(pointLineSide(actual.c.constants.inverted)!==inverted||Math.abs(actual.actual.signedDistance-(inverted?-value:value))>1e-6)fail('RESIDUAL','The retained polar-normal side or original distance differs from actual source.');}
 const serializedSketch=bounded(JSON.stringify(candidate));
 if(action==='create')return{revision:a.revision,ok:true as const,changed:true,serializedSketch,evidence:checked.evidence,dimension:{typeId:'DistancePL',objects:ids,distance:value,inverted,status,stage,index:indexInStage}};
 return{revision:a.revision,ok:true as const,changed:serializedSketch!==a.sketchJSON,serializedSketch,evidence:checked.evidence,dimension:{constraintId:a.intent.constraintId,action,typeId:'DistancePL',objects:ids,rawValue:action==='remove'?null:candidate.stages[stage].constraints[indexInStage].constants.distance,resolvedValue:actual?Math.abs(actual.actual.signedDistance):null,inverted,status}};
 }catch(error){return outcome(revision,error);}
}
export const addPointLineDistanceTransition=(request:any)=>change(request,'create');
export const changePointLineDistanceDimension=(request:any,action:'edit'|'remove')=>change(request,action);
function verify(request:any,dimensionMode:boolean){const revision=revisionOf(request);try{const a=pointLineRecord(request,dimensionMode?['revision','sketchJSON','externalParameters','action','intent','candidateJSON','dimension']:['revision','sketchJSON','externalParameters','intent','candidateJSON','dimension']);if(dimensionMode&&!['edit','remove'].includes(a.action))fail('INVALID','Invalid dimension action.');
 const expected=dimensionMode?changePointLineDistanceDimension({revision:a.revision,sketchJSON:a.sketchJSON,externalParameters:a.externalParameters,intent:a.intent},a.action):addPointLineDistanceTransition({revision:a.revision,sketchJSON:a.sketchJSON,externalParameters:a.externalParameters,intent:a.intent});
 if(!expected.ok)return expected;if(expected.serializedSketch!==bounded(a.candidateJSON))fail('CANDIDATE_MISMATCH','Independent point-line source differs: '+difference(JSON.parse(expected.serializedSketch),JSON.parse(a.candidateJSON)));
 const d=pointLineRecord(a.dimension,dimensionMode?['constraintId','action','typeId','objects','rawValue','resolvedValue','inverted','status']:['typeId','objects','distance','inverted','status','stage','index']);if(difference(expected.dimension,d)!=='no difference')fail('ADMISSION_CHANGED','Independent point-line metadata/side differs.');return{revision:a.revision,ok:true as const,verified:true};
 }catch(error){return outcome(revision,error);}}
export const verifyPointLineDistanceCandidate=(request:any)=>verify(request,false);
export const verifyPointLineDistanceDimensionCandidate=(request:any)=>verify(request,true);
