import {HeadlessSketchWorkspace} from './workspace';
import {replaySketchTransition} from './sketchTransition';
import {solveSketch} from './solve';
import {prepareConstraintGroup} from '../actions/constraintGroupAdmission';
import {captureConstraintGroupIntent,groupData,orientationGroupContract} from './constraintGroupIntent.mjs';
import {assertAllowedSolverGeometry} from './transitionGeometryPolicy.mjs';
import {sameRestoredSketch} from '../historyEquivalence.mjs';
import {assertVerifiedReplayGeometry} from './verifiedReplayGeometry';
import {captureAdmissionCause} from '../constr/admissionCause.mjs';
const fail=(code:string,message:string):never=>{throw Object.assign(Error(message),{code});};
const failure=(e:any)=>({code:typeof e?.code==='string'?e.code.slice(0,64):'CONSTRAINT_GROUP_INVALID',message:typeof e?.message==='string'?e.message.slice(0,512):'Constraint group failed.',...(e?.cause?{cause:captureAdmissionCause(e.cause)}:{})});
function bounded(value:any){if(typeof value!=='string'||value.length>1048576||new TextEncoder().encode(value).byteLength>1048576)fail('LIMIT','The group source exceeds1MiB.');return value;}
function bindings(value:any){const out=groupData(value,Reflect.ownKeys(value||{}) as string[]);if(Object.keys(out).length>1024||Object.keys(out).some(k=>!k||k.length>256||typeof out[k]!=='number'||!Number.isFinite(out[k])||Math.abs(out[k])>1e9))fail('INVALID_REQUEST','Invalid group external parameters.');return out;}
function replay(revision:string,source:string,external:any){const r=replaySketchTransition({revision,sketchJSON:bounded(source),externalParameters:external});if(!r.ok||!('serializedSketch' in r))throw Object.assign(Error(r.error.message),r.error);return r;}
const rootOf=(object:any)=>{let steps=0;while(object?.parent){if(++steps>64)fail('LIMIT','Sketch ownership depth exceeds its bound.');object=object.parent;}return object;};
function affectedObjects(pm:any,targets:any[]){
 const adjacency=new Map<any,any[]>(),all=pm.stages.flatMap(s=>s.algNumSystem.allConstraints);let refs=0;
 for(const c of all){const roots=[...new Set(c.objects.map(rootOf))];for(const r of roots){if(++refs>100000)fail('LIMIT','Constraint connectivity exceeds its bound.');const list=adjacency.get(r)||[];list.push(roots);adjacency.set(r,list);}}
 const seen=new Set<any>(targets.map(rootOf)),pending=[...seen];for(let at=0;at<pending.length;at++)for(const group of adjacency.get(pending[at])||[])for(const root of group)if(!seen.has(root)){seen.add(root);pending.push(root);}return seen;
}
const stripAdmission=(sketch:any)=>({...sketch,stages:sketch.stages.map(stage=>({...stage,constraints:stage.constraints.map(c=>{const row={...c};delete row.admission;return row;})}))});
export function changeConstraintGroup(request:any){let revision='';try{
 const a=groupData(request,['revision','sketchJSON','externalParameters','intent']);revision=a.revision;if(typeof revision!=='string'||!revision||revision.length>256)fail('INVALID_REQUEST','Invalid group revision.');
 const intent=captureConstraintGroupIntent(a.intent),orientation=orientationGroupContract(intent.kind),external=bindings(a.externalParameters),captured=replay(revision,a.sketchJSON,external),before=JSON.parse(captured.serializedSketch);
 if(before.objects.length>1024||before.stages.length!==1||before.stages[0].generators.length||before.objects.some(o=>!['Point','Segment','Circle','Arc'].includes(o.type)))fail('UNSUPPORTED_SKETCH','This group path currently supports one nongenerated ordinary analytic sketch stage.');
 const workspace=new HeadlessSketchWorkspace(external);workspace.io._loadSketch(structuredClone(before),{strict:true});const pm=workspace.parametricManager,index=workspace.createIndex(),objects=intent.ids.map(id=>index[id]);if(objects.some(o=>!o))fail('INVALID_TARGET','Choose actual inspected point/segment IDs.');
 const group=prepareConstraintGroup(pm,intent.kind,objects,intent.kind==='midpoint'?undefined:intent.angleDegrees,intent.action),affected=affectedObjects(pm,objects);
 const originalRows=new Map<any,any>();for(const s of pm.stages){const authored=s.algNumSystem.allConstraints.filter(c=>!c.internal);authored.forEach((c,i)=>originalRows.set(c,{stage:s.index,index:i,raw:before.stages[s.index].constraints[i]}));}
 const describe=(constraints:any[])=>constraints.map(c=>{const sys=c.stage.algNumSystem,at=sys.allConstraints.filter(row=>!row.internal).indexOf(c);if(at<0)fail('INTENT_CHANGED','The group member disappeared.');return{stage:c.stage.index,index:at,typeId:c.schema.id,objects:c.objects.map(o=>o.id),...(orientation?{angleDegrees:group.angleFor(c)}:{}),status:sys.redundant.has(c)?'redundant':'accepted'};});
 const receipt=()=>({kind:intent.kind,action:intent.action,ids:[...intent.ids],...(!orientation?{angleDegrees:intent.kind==='midpoint'?null:intent.angleDegrees}:{}),existing:!group.changed,rows:describe(group.constraints)});
 if(!group.changed){group.validate(pm.stages);return{revision,ok:true,changed:false,serializedSketch:a.sketchJSON,evidence:captured.evidence,group:receipt()};}
 pm.startTransaction();try{group.apply(pm);pm.finishTransaction(group.validate,false);}catch(error){if(pm.inTransaction)try{pm.finishTransaction(()=>{throw error},false);}catch{}throw error;}
 const candidate=JSON.parse(workspace.io.serializeSketch(before.metadata,{strict:true}));candidate.boundary=before.boundary;
 const validateGeometry=(sketch:any)=>{
  if(sketch.objects.length!==before.objects.length||sketch.stages.length!==before.stages.length)fail('INTENT_CHANGED','The group changed sketch membership.');
  sketch.objects.forEach((object,i)=>{const old=before.objects[i];if(object.id!==old.id||object.type!==old.type)fail('INTENT_CHANGED','Object identity changed.');assertAllowedSolverGeometry(object.type,old.data,object.data);if(!affected.has(rootOf(index[old.id]))&&JSON.stringify(object)!==JSON.stringify(old))fail('UNRELATED_GEOMETRY_CHANGED','The group changed independently unrelated geometry.');});
 };
 validateGeometry(candidate);
 const restored=structuredClone(candidate);restored.objects=restored.objects.map((o,i)=>({...o,data:before.objects[i].data}));
 for(const c of group.edited){const row=originalRows.get(c);if(!row||restored.stages[row.stage].constraints[row.index].typeId!=='AngleBetween')fail('INTENT_CHANGED','Edited group member changed.');restored.stages[row.stage].constraints[row.index].constants=structuredClone(row.raw.constants);}
 const added=describe(group.created);for(const row of [...added].sort((a,b)=>b.stage-a.stage||b.index-a.index)){const c=restored.stages[row.stage].constraints[row.index];if(c.typeId!==row.typeId||JSON.stringify(c.objects)!==JSON.stringify(row.objects))fail('INTENT_CHANGED','Created group member changed.');restored.stages[row.stage].constraints.splice(row.index,1);}
 if(!sameRestoredSketch(JSON.stringify(stripAdmission(before)),JSON.stringify(stripAdmission(restored))))fail('INTENT_CHANGED','Other authored sketch intent changed.');
 // Incremental admission is a draft, not the returned native candidate:
 // its warm internal Polar hints are not serialized. Construct the candidate
 // through the same cold path as Open, then verify THAT actual returned source
 // independently. There is one construction and one verification, no retry or
 // polishing loop, and neither source nor solver tolerances change.
 const solved=solveSketch({revision,sketch:candidate,boundary:structuredClone(candidate.boundary),externalParameters:external});if(!solved.ok)return solved;
 validateGeometry(solved.sketch);
 const verification=solveSketch({revision,sketch:structuredClone(solved.sketch),boundary:structuredClone(solved.sketch.boundary),externalParameters:external});if(!verification.ok)return verification;
 assertVerifiedReplayGeometry(solved.sketch,verification.sketch,verification.evidence,external);
 if(solved.evidence.length!==verification.evidence.length||solved.evidence.some((row,i)=>row.typeId!==verification.evidence[i].typeId||row.state!==verification.evidence[i].state))fail('ADMISSION_CHANGED','The returned cold candidate is not independently admission-stable.');
 const serializedSketch=bounded(JSON.stringify(solved.sketch));
 const verify=new HeadlessSketchWorkspace(external);verify.io._loadSketch(solved.sketch,{strict:true});const checked=verify.createIndex(),check=prepareConstraintGroup(verify.parametricManager,intent.kind,intent.ids.map(id=>checked[id]),intent.kind==='midpoint'?undefined:intent.angleDegrees,'create');if(check.changed)fail('INTENT_CHANGED','The reconstructed group is incomplete.');check.validate(verify.parametricManager.stages);
 const rows=solved.sketch.stages.flatMap(s=>s.constraints);if(rows.length!==solved.evidence.length||rows.some((c,i)=>c.typeId!==solved.evidence[i].typeId||c.admission?.state!==solved.evidence[i].state))fail('ADMISSION_CHANGED','Group replay admission changed.');
 // The final read-only workspace must corroborate the returned cold source,
 // not introduce an unchecked third classification into the public receipt.
 const checkedRows=describe(check.constraints);
 for(const row of checkedRows){const c=solved.sketch.stages[row.stage]?.constraints[row.index];if(!c||c.typeId!==row.typeId||c.stage!==row.stage||JSON.stringify(c.objects)!==JSON.stringify(row.objects)||c.admission?.state!==row.status)fail('ADMISSION_CHANGED','The reconstructed group receipt differs from the returned candidate.');}
 return{revision,ok:true,changed:true,serializedSketch,evidence:solved.evidence,group:{...receipt(),rows:checkedRows}};
 }catch(error){return{revision,ok:false,error:failure(error)};}}
export function verifyConstraintGroup(request:any){let revision='';try{const a=groupData(request,['revision','sketchJSON','externalParameters','intent','candidateJSON']);revision=a.revision;const intent=captureConstraintGroupIntent(a.intent),expected=changeConstraintGroup({revision,sketchJSON:a.sketchJSON,externalParameters:bindings(a.externalParameters),intent});if(!expected.ok)return expected;if(!sameRestoredSketch(expected.serializedSketch,bounded(a.candidateJSON)))fail('INTENT_CHANGED','The candidate differs from independent reconstruction of the complete requested group.');return{revision,ok:true,verified:true};}catch(error){return{revision,ok:false,error:failure(error)};}}
