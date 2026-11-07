import {admissionCause,withAdmissionCause,failureCause} from '../constr/admissionCause.mjs';
import {HeadlessSketchWorkspace} from './workspace';
import {replaySketchTransition} from './sketchTransition';
import {solveSketch} from './solve';
import {prepareLineRelation} from '../actions/lineRelationAdmission';
import {directionalRelationValid} from '../constr/lineRelationDomain.mjs';
import {assertAllowedSolverGeometry} from './transitionGeometryPolicy.mjs';
import {sameRestoredSketch} from '../historyEquivalence.mjs';
const fail=(code:string,message:string)=>withAdmissionCause(Object.assign(Error(message),{code}),code==='RESIDUAL'?admissionCause('original-residual-failure'):['DIRECTION_DOMAIN','PROJECTED_DIRECTION_DOMAIN','DISTANCE_DOMAIN'].includes(code)?admissionCause('invalid-domain'):undefined);
function record(value:any,keys:string[]){if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value))||Reflect.ownKeys(value).length!==keys.length)throw fail('INVALID','Invalid line relation request.');const out:any={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw fail('INVALID','Line relation fields must be data.');out[key]=d.value;}return out;}
function external(value:any){if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))throw fail('INVALID','External parameters must be plain data.');const keys=Reflect.ownKeys(value),out=Object.create(null);if(keys.length>1024)throw fail('LIMIT','Too many external parameters.');for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(typeof key!=='string'||!key||key.length>256||!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value')||typeof d.value!=='number'||!Number.isFinite(d.value)||Math.abs(d.value)>1e9)throw fail('INVALID','Invalid external parameter.');out[key]=d.value;}return out;}
function intent(value:any){const a=record(value,['kind','ids']);if(!['collinear','axis-symmetry'].includes(a.kind)||!Array.isArray(a.ids)||Object.getPrototypeOf(a.ids)!==Array.prototype||a.ids.length!==(a.kind==='collinear'?2:3)||Reflect.ownKeys(a.ids).length!==a.ids.length+1)throw fail('INVALID','Choose current line relation targets.');a.ids=Array.from({length:a.ids.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(a.ids,String(i));if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value')||typeof d.value!=='string'||!d.value||d.value.length>256)throw fail('INVALID','Invalid line relation ID.');return d.value;});if(a.ids[0]===a.ids[1])throw fail('INVALID_TARGET','Choose two distinct primary targets.');return a;}
function verifyIntent(before:any,after:any,ids:string[],stage:number,status:string,typeId:string){
 if(before.objects.length!==after.objects.length||before.stages.length!==after.stages.length)throw fail('INTENT_CHANGED','Sketch structure changed.');
 after.objects.forEach((o,i)=>{if(o.type!==before.objects[i]?.type)throw fail('INTENT_CHANGED','Object type changed.');assertAllowedSolverGeometry(o.type,before.objects[i].data,o.data);});
 const restored={...after,objects:after.objects.map((o,i)=>({...o,data:before.objects[i].data})),stages:after.stages.map(s=>({...s,constraints:[...s.constraints]}))},prior=before.stages[stage]?.constraints,next=restored.stages[stage]?.constraints;
 if(!Array.isArray(prior)||!Array.isArray(next)||next.length!==prior.length+1)throw fail('INTENT_CHANGED','Exactly one line relation must be added.');let index=0;while(index<prior.length&&JSON.stringify(prior[index])===JSON.stringify(next[index]))index++;
 const c=next[index];if(c?.typeId!==typeId||c.stage!==stage||JSON.stringify(c.objects)!==JSON.stringify(ids)||Object.keys(c.constants||{}).length||c.admission?.version!==1||c.admission.state!==status)throw fail('INTENT_CHANGED','The requested relation identity or admission changed.');
 next.splice(index,1);if(!sameRestoredSketch(JSON.stringify(before),JSON.stringify(restored)))throw fail('INTENT_CHANGED','Existing authored intent changed.');return index;
}
function measure(workspace:any,kind:string,ids:string[]){
 const index=workspace.createIndex(),objects=ids.map(id=>index[id]),typeId=kind==='collinear'?'Collinear':'AxisSymmetry';
 if(!directionalRelationValid({schema:{id:typeId},objects}))throw fail('DIRECTION_DOMAIN','A live line direction is invalid.');
 if(kind==='collinear'){
  const [a,b]=objects,dx=a.b.x-a.a.x,dy=a.b.y-a.a.y,n=Math.hypot(dx,dy);
  for(const p of [b.a,b.b])if(Math.abs((p.x-a.a.x)*dy-(p.y-a.a.y)*dx)/n>1e-6)throw fail('RESIDUAL','The segments do not share a supporting line.');
 }else{
  const [p,q,line]=objects,dx=line.b.x-line.a.x,dy=line.b.y-line.a.y,n2=dx*dx+dy*dy,u=((p.x-line.a.x)*dx+(p.y-line.a.y)*dy)/n2;
  const reflected={x:2*(line.a.x+u*dx)-p.x,y:2*(line.a.y+u*dy)-p.y};
  if(![reflected.x,reflected.y].every(Number.isFinite)||Math.abs(q.x-reflected.x)>1e-6||Math.abs(q.y-reflected.y)>1e-6)throw fail('RESIDUAL','The points are not reflections about the live axis.');
 }
}
// Genuine workspace candidate only; no history or publication authority here.
export function addLineRelationTransition(request:any){let revision='';try{
 const r=request&&typeof request==='object'?Object.getOwnPropertyDescriptor(request,'revision'):null;if(r?.enumerable&&Object.prototype.hasOwnProperty.call(r,'value')&&typeof r.value==='string'&&r.value.length<=256)revision=r.value;
 const a=record(request,['revision','sketchJSON','externalParameters','intent']);if(typeof a.revision!=='string'||!a.revision||a.revision.length>256)throw fail('INVALID','Invalid relation revision.');revision=a.revision;const selected=intent(a.intent),bindings=external(a.externalParameters),captured=replaySketchTransition({revision,sketchJSON:a.sketchJSON,externalParameters:bindings});if(!captured.ok||!('serializedSketch' in captured))return captured;
 const before=JSON.parse(captured.serializedSketch);if(before.objects.length>1024)throw fail('LIMIT','Too many authored objects.');const workspace=new HeadlessSketchWorkspace(bindings);workspace.io._loadSketch(before,{strict:true});const pm=workspace.parametricManager,index=workspace.createIndex(),objects=selected.ids.map(id=>index[id]);if(objects.some(o=>!o))throw fail('INVALID_TARGET','A selected segment is missing.');
 const {constraint,duplicate,validate}=prepareLineRelation(pm,selected.kind,objects),typeId=selected.kind==='collinear'?'Collinear':'AxisSymmetry';
 if(duplicate){measure(workspace,selected.kind,selected.ids);const stage=duplicate.stage.index,nativeIds=duplicate.objects.map(o=>o.id),at=before.stages[stage].constraints.findIndex(c=>c.typeId===typeId&&JSON.stringify(c.objects)===JSON.stringify(nativeIds));if(at<0)throw fail('INTENT_CHANGED','The existing native relation is unavailable.');return {revision,ok:true as const,serializedSketch:a.sketchJSON,evidence:captured.evidence,relation:{kind:selected.kind,typeId,objects:selected.ids,stage,index:at,status:'redundant',existing:true}};}
 pm.startTransaction();try{pm._add(constraint);pm.finishTransaction(stages=>{try{validate(stages)}catch(error){throw withAdmissionCause(error,constraint.stage?.solverSystem.getAdmissionCause(constraint));}},false);}catch(error){if(pm.inTransaction)try{pm.finishTransaction(()=>{throw error},false)}catch(_){}throw error;}
 const stage=constraint.stage.index,status=(constraint.stage as any).algNumSystem.redundant.has(constraint)?'redundant':'accepted',candidate=JSON.parse(workspace.io.serializeSketch(before.metadata,{strict:true}));candidate.boundary=before.boundary;const at=verifyIntent(before,candidate,selected.ids,stage,status,typeId);
 const solved=solveSketch({revision,sketch:candidate,boundary:structuredClone(candidate.boundary),externalParameters:bindings});if(!solved.ok)return solved;const serializedSketch=JSON.stringify(solved.sketch);if(serializedSketch.length>1048576||new TextEncoder().encode(serializedSketch).byteLength>1048576)throw fail('LIMIT','The resulting sketch exceeds its limit.');if(!sameRestoredSketch(JSON.stringify(candidate),serializedSketch))throw fail('CURRENT_GEOMETRY_MISMATCH','Verification changed the solved geometry.');
 const authored=solved.sketch.stages.flatMap(s=>s.constraints);if(authored.length!==solved.evidence.length||authored.some((c,i)=>c.typeId!==solved.evidence[i].typeId||c.admission?.version!==1||c.admission.state!==solved.evidence[i].state))throw fail('ADMISSION_CHANGED','Candidate admission changed.');
 const verified=new HeadlessSketchWorkspace(bindings);verified.io._loadSketch(solved.sketch,{strict:true});measure(verified,selected.kind,selected.ids);
 return {revision,ok:true as const,serializedSketch,evidence:solved.evidence,relation:{kind:selected.kind,typeId,objects:selected.ids,stage,index:at,status,existing:false}};
 }catch(error){return {revision,ok:false as const,error:{code:typeof error?.code==='string'?error.code:'INVALID',message:typeof error?.message==='string'?error.message:'Line relation failed.',...(failureCause(error)?{cause:failureCause(error)}:{})}};}}
