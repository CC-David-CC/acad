import {HeadlessSketchWorkspace} from './workspace';
import {replaySketchTransition} from './sketchTransition';
import {solveSketch} from './solve';
import {assertAllowedSolverGeometry} from './transitionGeometryPolicy.mjs';
import {captureAdmissionCause} from '../constr/admissionCause.mjs';
import {sameRestoredSketch} from '../historyEquivalence.mjs';
import {captureDrivingDimensionIntent,resolveDrivingDimension,drivingLengthField,classifyDrivingDimensionDelta} from './drivingDimensionTarget.mjs';
const fail=(code:string,message:string)=>Object.assign(Error(message),{code});
const failure=(error:any)=>({code:typeof error?.code==='string'?error.code.slice(0,64):'DIMENSION_INVALID',message:typeof error?.message==='string'?error.message.slice(0,512):'Existing dimension change failed.',...(error?.cause?{cause:captureAdmissionCause(error.cause)}:{})});
function record(v:any,keys:string[]){if(!v||typeof v!=='object'||Array.isArray(v)||![Object.prototype,null].includes(Object.getPrototypeOf(v))||Reflect.ownKeys(v).length!==keys.length)throw fail('INVALID','Invalid driving dimension request.');const o:any={};for(const k of keys){const d=Object.getOwnPropertyDescriptor(v,k);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw fail('INVALID','Dimension fields must be data.');o[k]=d.value;}return o;}
function external(v:any){const o=record(v,Reflect.ownKeys(v||{}) as string[]),out=Object.create(null);if(Object.keys(o).length>1024)throw fail('LIMIT','Too many dimension parameters.');for(const k of Object.keys(o)){if(!k||k.length>256||typeof o[k]!=='number'||!Number.isFinite(o[k])||Math.abs(o[k])>1e9)throw fail('INVALID','Invalid dimension parameter.');out[k]=o[k];}return out;}
function bounded(v:any){if(typeof v!=='string'||v.length>1048576||new TextEncoder().encode(v).byteLength>1048576)throw fail('LIMIT','The dimension source exceeds its limit.');return v;}
function revisionOf(v:any){const d=v&&Object.getOwnPropertyDescriptor(v,'revision');return d?.enumerable&&Object.prototype.hasOwnProperty.call(d,'value')&&typeof d.value==='string'?d.value:'';}
function replay(revision:string,text:string,bindings:any){const r=replaySketchTransition({revision,sketchJSON:bounded(text),externalParameters:bindings});if(!r.ok||!('serializedSketch' in r))throw Object.assign(Error(r.error.message),r.error);return r;}
function geometry(before:any,after:any){if(before.objects.length!==after.objects.length)throw fail('INTENT_CHANGED','Sketch object membership changed.');after.objects.forEach((o,i)=>{if(before.objects[i]?.type!==o.type)throw fail('INTENT_CHANGED','Sketch object type changed.');assertAllowedSolverGeometry(o.type,before.objects[i].data,o.data);});}
function evidence(sketch:any,rows:any[]){const c=sketch.stages.flatMap(s=>s.constraints);if(c.length!==rows.length||c.some((v,i)=>v.typeId!==rows[i].typeId||v.admission?.version!==1||v.admission.state!==rows[i].state))throw fail('ADMISSION_CHANGED','Dimension admission changed during verification.');}
function expectedDelta(before:any,after:any,intent:any,action:string){
 const row=resolveDrivingDimension(before,intent.constraintId),field=drivingLengthField(row.typeId),expected=structuredClone(before);
 if(action==='edit')expected.stages[row.stage].constraints[row.index].constants[field]=String(intent.value);else expected.stages[row.stage].constraints.splice(row.index,1);
 // Both actual and expected geometry are independently checked by the caller.
 const strip=(s:any)=>({...s,objects:s.objects.map(o=>({...o,data:null})),stages:s.stages.map(stage=>({...stage,constraints:stage.constraints.map(c=>{const x={...c};delete x.admission;return x})}))});
 if(!sameRestoredSketch(JSON.stringify(strip(expected)),JSON.stringify(strip(after))))throw fail('INTENT_CHANGED','Other authored sketch intent changed.');return row;
}
export function changeDrivingDimension(request:any){let revision=revisionOf(request);try{
 const a=record(request,['revision','sketchJSON','externalParameters','action','intent']);if(!revision||revision.length>256)throw fail('INVALID','Invalid dimension revision.');const intent=captureDrivingDimensionIntent(a.intent,a.action),bindings=external(a.externalParameters),captured=replay(revision,a.sketchJSON,bindings),before=JSON.parse(captured.serializedSketch),row=resolveDrivingDimension(before,intent.constraintId);
 let value:any=null;if(a.action==='edit'){value=typeof intent.value==='number'?intent.value:bindings[intent.value];if(typeof value!=='number'||!Number.isFinite(value)||value<=0||value>1e6)throw fail('INVALID_VALUE','A current positive typed length or literal millimeters is required.');}
 const dimension=(rawValue:any,resolvedValue:any,status:string)=>({constraintId:intent.constraintId,action:a.action,typeId:row.typeId,objects:[...row.objects],rawValue,resolvedValue,status});
 if(a.action==='edit'&&String(row.rawValue)===String(intent.value))return {revision,ok:true,changed:false,serializedSketch:a.sketchJSON,evidence:captured.evidence,dimension:dimension(row.rawValue,row.resolvedValue,before.stages[row.stage].constraints[row.index].admission.state)};
 const workspace=new HeadlessSketchWorkspace(bindings);workspace.io._loadSketch(before,{strict:true});const pm=workspace.parametricManager,c=pm.stages[row.stage]?.algNumSystem.allConstraints.filter(c=>!c.internal)[row.index];
 if(!c||c.schema.id!==row.typeId||c.objects.length!==1||c.objects[0].id!==row.objects[0])throw fail('INVALID_TARGET','The reconstructed dimension identity changed.');
 const field=drivingLengthField(row.typeId);if(a.action==='edit')c.validateCandidateConstants({...c.constants,[field]:String(intent.value)},pm.constantResolver);
 pm.startTransaction();try{
  if(a.action==='edit')c.updateConstant(field,String(intent.value));else pm._removeConstraint(c);
  pm.finishTransaction(stages=>{for(const stage of stages)for(const constraint of stage.algNumSystem.allConstraints)if(stage.algNumSystem.conflicting.has(constraint)&&!stage.algNumSystem.redundant.has(constraint))throw Object.assign(fail('DIMENSION_REJECTED','The constraint change was rejected by the sketch solver.'),{cause:stage.algNumSystem.getAdmissionCause(constraint)});},false);
 }catch(error){if(pm.inTransaction)try{pm.finishTransaction(()=>{throw error},false)}catch(_){}throw error;}
 const candidate=JSON.parse(workspace.io.serializeSketch(before.metadata,{strict:true}));candidate.boundary=before.boundary;geometry(before,candidate);expectedDelta(before,candidate,intent,a.action);
 const solved=solveSketch({revision,sketch:candidate,boundary:structuredClone(candidate.boundary),externalParameters:bindings});if(!solved.ok)return solved;const serializedSketch=bounded(JSON.stringify(solved.sketch));
 if(!sameRestoredSketch(JSON.stringify(candidate),serializedSketch))throw fail('CURRENT_GEOMETRY_MISMATCH','Dimension verification changed solved geometry.');evidence(solved.sketch,solved.evidence);
 let next:any=null;if(a.action==='edit'){next=resolveDrivingDimension(solved.sketch,intent.constraintId);if(Math.abs(next.resolvedValue-value)>1e-6)throw fail('RESIDUAL','The edited dimension differs from actual solved geometry.');}
 return {revision,ok:true,changed:true,serializedSketch,evidence:solved.evidence,dimension:dimension(next?.rawValue??null,next?.resolvedValue??null,next?solved.sketch.stages[row.stage].constraints[row.index].admission.state:'removed')};
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
  const delta=classifyDrivingDimensionDelta(before,after);if(!delta)throw fail('INTENT_CHANGED','Typed travel requires exactly one supported dimension edit or removal.');
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
