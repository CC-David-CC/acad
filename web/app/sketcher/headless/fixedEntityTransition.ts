import {assertClosedFixedEntityTarget} from './closedFixedEntityTarget';
import {HeadlessSketchWorkspace} from './workspace';
import {solveSketch} from './solve';
import {evaluateCapturedSketch} from './capturedSketchEvaluation';
import {assertVerifiedReplayGeometry} from './verifiedReplayGeometry';
import {firstCapturedGeometryDifference as difference} from './capturedGeometryScope';
import {inspectFixedEntity,prepareFixedEntity} from '../actions/fixedEntityAdmission';
import {fixedEntityValid} from '../constr/fixedEntityDomain.mjs';
import {validateConstraintGeometry} from './sketchValidation';
import {fixedTypes,fixedRecord as record,captureFixedEntityIntent,captureFixedEntityReceipt,fixedEntityLocator} from './fixedEntityIntent.mjs';
import {failureCause,withAdmissionCause} from '../constr/admissionCause.mjs';
const fail=(code:string,message:string):never=>{throw Object.assign(Error(message),{code});};
function text(v:any){if(typeof v!=='string'||v.length>1048576||new TextEncoder().encode(v).byteLength>1048576)fail('LIMIT','Fix source exceeds1MiB.');return v;}
function bindings(v:any){const out=record(v,Reflect.ownKeys(v||{}));if(Reflect.ownKeys(out).length>1024)fail('LIMIT','Fix binding inventory exceeds limits.');for(const k of Reflect.ownKeys(out))if(typeof k!=='string'||!k||k.length>256||typeof out[k]!=='number'||!Number.isFinite(out[k])||Math.abs(out[k])>1e9)fail('FIX_ENTITY_INVALID','Fix requires current bounded numeric bindings.');return out;}
const revisionOf=v=>typeof v?.revision==='string'?v.revision.slice(0,256):'';
function failure(revision:string,e:any){const cause=failureCause(e);return{revision,ok:false as const,error:{code:typeof e?.code==='string'?e.code.slice(0,64):'FIX_ENTITY_FAILED',message:typeof e?.message==='string'?e.message.slice(0,512):'Fix operation failed.',...(cause?{cause}:{})}};}
function cold(revision:string,sketch:any,external:any){let auxiliary:any;const result=solveSketch({revision,sketch:structuredClone(sketch),boundary:structuredClone(sketch.boundary),externalParameters:external},undefined,b=>auxiliary=b);if(!result.ok)throw withAdmissionCause(Object.assign(Error(result.error.message),{code:result.error.code}),result.error.cause);return{result,auxiliary};}
function classifications(source:any,rows:any[]){let i=0;for(const stage of source.stages)for(const c of stage.constraints){const row=rows[i++];if(!row||row.typeId!==c.typeId||!['accepted','redundant'].includes(row.state))fail('ADMISSION_CHANGED','Fix evidence membership changed.');c.admission={version:1,state:row.state};}if(i!==rows.length)fail('ADMISSION_CHANGED','Fix evidence count changed.');}
const semantic=c=>{const copy={...c};delete copy.admission;return copy;};
const withoutAdmission=s=>({...s,stages:s.stages.map(t=>({...t,constraints:t.constraints.map(semantic)}))});
function locate(source:any,id:string){for(let stage=0;stage<source.stages.length;stage++)for(let index=0;index<source.stages[stage].constraints.length;index++){const c=source.stages[stage].constraints[index];if(Object.hasOwn(fixedTypes,c.typeId)&&fixedEntityLocator(stage,index,c)===id)return{stage,index,c};}fail('INVALID_TARGET','The discovered whole-entity Fix row is unavailable.');}
function capture(request:any){const a=record(request,['revision','sketchJSON','externalParameters','action','intent']);if(typeof a.revision!=='string'||!a.revision||a.revision.length>256)fail('FIX_ENTITY_INVALID','Invalid Fix revision.');a.sketchJSON=text(a.sketchJSON);a.externalParameters=bindings(a.externalParameters);a.intent=captureFixedEntityIntent(a.intent,a.action);return a;}
function receipt(stage:number,index:number,c:any,status:string,existing:boolean){return captureFixedEntityReceipt({typeId:c.typeId,id:c.objects[0],stage,index,constraintId:fixedEntityLocator(stage,index,c),status,existing});}

export function changeFixedEntity(request:any){const revision=revisionOf(request);try{
 const a=capture(request),before=JSON.parse(a.sketchJSON);if(!Array.isArray(before.objects)||before.objects.length>1024)fail('LIMIT','Closed Fix supports at most1024 source objects.');const original=cold(a.revision,before,a.externalParameters);assertVerifiedReplayGeometry(before,original.result.sketch,original.result.evidence,a.externalParameters);const originalChecked=evaluateCapturedSketch(before,a.externalParameters,original.result.evidence,undefined,original.auxiliary);
 const workspace=new HeadlessSketchWorkspace(a.externalParameters);workspace.io._loadSketch(structuredClone(before),{strict:true});const pm=workspace.parametricManager,index=workspace.createIndex();let constraint:any,stage:number,at:number,prepared:any;
 if(a.action==='create'){
  assertClosedFixedEntityTarget(pm,index[a.intent.id],index);prepared=prepareFixedEntity(pm,index[a.intent.id]);constraint=prepared.constraint;stage=prepared.stage.index;
  if(prepared.existing){at=prepared.stage.solverSystem.allConstraints.filter(c=>!c.internal).indexOf(constraint);const c=before.stages[stage]?.constraints[at],offset=before.stages.slice(0,stage).reduce((n,s)=>n+s.constraints.length,0);if(!c||c.typeId!==constraint.schema.id||difference(c.objects,[a.intent.id])!=='no difference')fail('INVALID_TARGET','Existing Fix ownership changed.');return{revision:a.revision,ok:true as const,changed:false,serializedSketch:a.sketchJSON,evidence:originalChecked.evidence,fixed:receipt(stage,at,c,originalChecked.evidence[offset+at].state,true)};}
  at=before.stages[stage].constraints.length;
 }else{
  const located=locate(before,a.intent.constraintId);stage=located.stage;at=located.index;constraint=pm.stages[stage]?.solverSystem.allConstraints.filter(c=>!c.internal)[at];if(!constraint||constraint.schema.id!==located.c.typeId||constraint.objects.length!==1||index[located.c.objects[0]]!==constraint.objects[0]||!fixedEntityValid(constraint))fail('INVALID_TARGET','The actual Fix row ownership changed.');assertClosedFixedEntityTarget(pm,constraint.objects[0],index);inspectFixedEntity(pm,constraint.objects[0]);constraint.resolveConstants(pm.constantResolver);validateConstraintGeometry(constraint);
 }
 const expected=structuredClone(before),old=before.stages[stage]?.constraints[at];
 pm.startTransaction();try{
  if(a.action==='create')pm._add(constraint);else pm._removeConstraint(constraint);
  pm.finishTransaction(stages=>{if(prepared)prepared.validate(stages);for(const s of stages)for(const c of s.solverSystem.allConstraints){const sys=s.solverSystem;if(sys.conflicting.has(c)&&!sys.redundant.has(c))throw withAdmissionCause(Object.assign(Error('Unfix rejected a retained original relationship.'),{code:'FIX_ENTITY_REJECTED'}),sys.getAdmissionCause(c));}},false);
 }catch(e){if(pm.inTransaction)try{pm.finishTransaction(()=>{throw e},false);}catch{}throw e;}
 const warm=JSON.parse(workspace.io.serializeSketch(before.metadata,{strict:true}));warm.boundary=structuredClone(before.boundary);
 if(a.action==='create'){
  const row=warm.stages[stage]?.constraints[at];if(!row||row.typeId!==constraint.schema.id||row.stage!==stage||difference(row.objects,[a.intent.id])!=='no difference'||difference(row.constants,constraint.constants)!=='no difference')fail('INTENT_CHANGED','Fix did not append the actual whole-entity literal snapshot.');expected.stages[stage].constraints.push(structuredClone(row));
 }else expected.stages[stage].constraints.splice(at,1);
 // Fix/unfix never authorizes geometry movement. Warm optimization is not
 // publication authority; retain ALL accepted physical geometry exactly.
 const restored={...warm,objects:warm.objects.map((o,i)=>({...o,data:before.objects[i]?.data}))};if(difference(withoutAdmission(expected),withoutAdmission(restored))!=='no difference')fail('INTENT_CHANGED','Fix changed unrelated authored intent: '+difference(withoutAdmission(expected),withoutAdmission(restored)));
 classifications(expected,warm.stages.flatMap(s=>s.constraints.map(c=>({typeId:c.typeId,state:c.admission?.state}))));
 const first=cold(a.revision,expected,a.externalParameters);assertVerifiedReplayGeometry(expected,first.result.sketch,first.result.evidence,a.externalParameters);classifications(expected,first.result.evidence);const second=cold(a.revision,first.result.sketch,a.externalParameters);assertVerifiedReplayGeometry(first.result.sketch,second.result.sketch,second.result.evidence,a.externalParameters);assertVerifiedReplayGeometry(expected,second.result.sketch,second.result.evidence,a.externalParameters);
 if(first.result.evidence.length!==second.result.evidence.length||first.result.evidence.some((r,i)=>r.typeId!==second.result.evidence[i].typeId||r.state!==second.result.evidence[i].state))fail('ADMISSION_CHANGED','Fix classifications are not independently stable.');
 const checked=evaluateCapturedSketch(expected,a.externalParameters,first.result.evidence,undefined,first.auxiliary),offset=expected.stages.slice(0,stage).reduce((n,s)=>n+s.constraints.length,0),row=a.action==='create'?expected.stages[stage].constraints[at]:old,status=a.action==='remove'?'removed':checked.evidence[offset+at]?.state;
 if(a.action==='create'&&(!['accepted','redundant'].includes(status)||checked.evidence[offset+at]?.typeId!==row.typeId))fail('ADMISSION_CHANGED','Fix lacks actual final row admission.');
 return{revision:a.revision,ok:true as const,changed:true,serializedSketch:text(JSON.stringify(expected)),evidence:checked.evidence,fixed:receipt(stage,at,row,status,false)};
 }catch(e){return failure(revision,e);}}

export function verifyFixedEntityCandidate(request:any){const revision=revisionOf(request);try{
 const a=record(request,['revision','sketchJSON','externalParameters','action','intent','candidateJSON','fixed','changed']),expected=changeFixedEntity({revision:a.revision,sketchJSON:a.sketchJSON,externalParameters:a.externalParameters,action:a.action,intent:a.intent});if(!expected.ok)return expected;const fixed=captureFixedEntityReceipt(a.fixed);
 if(typeof a.changed!=='boolean'||a.changed!==expected.changed||expected.serializedSketch!==text(a.candidateJSON)||difference(expected.fixed,fixed)!=='no difference')fail('INVALID_CANDIDATE','Fix candidate/source/actual receipt differs from independent original request.');if(expected.changed){const travel=verifyFixedEntityTravel({revision:a.revision,sketchJSON:a.sketchJSON,candidateJSON:a.candidateJSON,externalParameters:a.externalParameters});if(!travel.ok)return travel;}return{revision,ok:true as const,verified:true};
 }catch(e){return failure(revision,e);}}

// Only this exact creation/removal family is classified here. No scalar edit
// of read-only snapshot constants or geometry is silently called Fix travel.
export function classifyFixedEntityDelta(before:any,after:any){
 let change:any=null;
 for(let stage=0;stage<Math.max(before.stages.length,after.stages.length);stage++){
  const a=before.stages[stage]?.constraints||[],b=after.stages[stage]?.constraints||[];
  if(difference(a.filter(c=>Object.hasOwn(fixedTypes,c.typeId)).map(semantic),b.filter(c=>Object.hasOwn(fixedTypes,c.typeId)).map(semantic))==='no difference')continue;
  let i=0;while(i<Math.min(a.length,b.length)&&difference(semantic(a[i]),semantic(b[i]))==='no difference')i++;
  const removed=a.length===b.length+1,added=b.length===a.length+1,c=removed?a[i]:added?b[i]:null;
  if(!c||!Object.hasOwn(fixedTypes,c.typeId))fail('INTENT_CHANGED','Fix snapshots are read-only; explicitly unfix/edit/refix.');
  if(change)fail('INTENT_CHANGED','Exactly one Fix row may travel.');const longer=structuredClone(removed?before:after),shorter=removed?after:before;longer.stages[stage].constraints.splice(i,1);
  if(difference(withoutAdmission(longer),withoutAdmission(shorter))!=='no difference')fail('INTENT_CHANGED','Fix travel changed geometry or unrelated authored intent.');change={source:removed?before:after,target:shorter,stage,index:i,c};
 }
 return change;
}
export function verifyFixedEntityTravel(request:any,boundary=false){const revision=revisionOf(request);try{
 const a=record(request,['revision','sketchJSON','candidateJSON','externalParameters']);if(typeof a.revision!=='string'||!a.revision||a.revision.length>256)fail('FIX_ENTITY_INVALID','Invalid Fix travel revision.');a.externalParameters=bindings(a.externalParameters);const before=JSON.parse(text(a.sketchJSON)),after=JSON.parse(text(a.candidateJSON)),delta=classifyFixedEntityDelta(before,after);
 if(!delta){if(boundary)return{revision,ok:true as const,verified:true};fail('INVALID_CANDIDATE','The journal pair is not a Fix creation/removal.');}
 const source=JSON.stringify(delta.source),result=changeFixedEntity({revision:a.revision,sketchJSON:source,externalParameters:a.externalParameters,action:'remove',intent:{constraintId:fixedEntityLocator(delta.stage,delta.index,delta.c)}});if(!result.ok)return result;
 if(difference(JSON.parse(result.serializedSketch),delta.target)!=='no difference')fail('INVALID_CANDIDATE','Fix journal pair does not reproduce the original removal.');return{revision,ok:true as const,verified:true};
 }catch(e){return failure(revision,e);}}
