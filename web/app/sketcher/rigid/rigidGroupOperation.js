import {AlgNumConstraint, ConstraintDefinitions} from '../constr/ANConstraints';
import {createSketchRevisionGuard} from '../actions/sketchRevisionGuard';
import {runSketchTransaction} from '../actions/sketchTransaction';
import {planRigidSegments} from './rigidGroupPlan.mjs';
import {RigidGroup} from './rigidGroup';
import {assertRigidStageValid,assertRetainedStageValid} from './rigidGroupDomain.mjs';
import {Polynomial,POW_1_FN} from '../constr/polynomial';

const revisions=createSketchRevisionGuard();
const inspections=new WeakMap();
function current(viewer) {
  const values=[]; viewer.traverse(value=>{if (value?.id) values.push(value);});
  if(values.length>1024 || values.some(x=>typeof x.id!=='string'||x.id.length>256) || new Set(values.map(x=>x.id)).size!==values.length) throw Error('Sketch identities exceed limits or are ambiguous.');
  return values;
}
function live(options) {
  if(options.signal?.aborted || (options.valid && options.valid()!==true)) throw Error('The sketch window or account is no longer available.');
}
function optionsCopy(input) {
  if(!input || typeof input!=='object' || Array.isArray(input)) throw Error('Invalid command options.');
  const out={};for(const key of Reflect.ownKeys(input)){
    const descriptor=Object.getOwnPropertyDescriptor(input,key);
    if(typeof key!=='string'||!['signal','valid'].includes(key)||!descriptor?.enumerable||!Object.prototype.hasOwnProperty.call(descriptor,'value')) throw Error('Invalid command options.');
    out[key]=descriptor.value;
  }
  if(out.valid!==undefined && typeof out.valid!=='function')throw Error('Invalid lifetime guard.');
  if(out.signal!==undefined)try{Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get.call(out.signal)}catch{throw Error('Invalid cancellation signal.');}
  return out;
}
export function inspectRigidGroups(viewer,input={}) {
  const options=optionsCopy(input);live(options);inspections.delete(viewer);
  const revision=revisions.capture(viewer);
  try {
    const refs=current(viewer);live(options);revisions.verify(viewer,revision);
    inspections.set(viewer,{revision,refs});
    return {revision,objects:refs.filter(x=>x.TYPE==='Segment'||x.TYPE==='RigidGroup').map(x=>({id:x.id,type:x.TYPE}))};
  } catch(error) {revisions.release(viewer,revision);throw error;}
}
export function releaseRigidGroupInspection(viewer,revision){
  if(inspections.get(viewer)?.revision===revision){inspections.delete(viewer);revisions.release(viewer,revision);}
}
function checkSelection(viewer,members){
  const pm=viewer?.parametricManager,layer=viewer?.findLayerByName('sketch');
  if(!pm||pm.inTransaction||viewer.historyManager?.recoverySnapshot||!layer||!Array.isArray(members)||members.length<2||members.length>32)throw Error('Select 2–32 segments in a ready sketch.');
  const available=current(viewer),stage=pm.stage;
  if(members.some(member=>!available.includes(member)||member.TYPE!=='Segment'||member.stage!==stage||member.layer!==layer||member.isGenerated))throw Error('Rigid members must be current authored segments in the active stage.');
  if(pm.stages.some(s=>s.algNumSystem.allConstraints.some(c=>c.schema.id==='RigidGroup'&&c.objects.slice(1).some(o=>members.includes(o)))))throw Error('A segment already belongs to a rigid group.');
  return {pm,layer,stage,available};
}
export function createRigidGroup(viewer,members,beforeSubmit=()=>{}) {
  const {pm,layer,stage,available}=checkSelection(viewer,members);
  const id='rigid:'+crypto.randomUUID();if(available.some(value=>value.id===id))throw Error('Rigid group identity collision.');
  const plan=planRigidSegments(id,members),group=new RigidGroup(id,{version:plan.version,members:plan.members,points:plan.points,transform:plan.transform});
  const relation=new AlgNumConstraint(ConstraintDefinitions.RigidGroup,[group,...members]);
  beforeSubmit();
  runSketchTransaction(viewer,{
    mutate:()=>{layer.add(group);if(group.stage!==stage)throw Error('Rigid group stage changed.');stage.addConstraint(relation);},
    validate:stages=>{if(!stage.algNumSystem.allConstraints.includes(relation))throw Error('Rigid group was not admitted.');assertRigidStageValid(stage,group,members);stages.forEach(assertRetainedStageValid);},
    rollbackExtra:()=>{if(layer.objects.includes(group))layer.remove(group);else if(group.stage)group.stage.unassignObject(group);group.layer=null;},
  });
  try{pm.refresh();}catch(error){console.error('Rigid group accepted, but refresh failed:',error);}
  return {id,status:'accepted'};
}

function resolveGroup(viewer,group) {
  const pm=viewer?.parametricManager,refs=current(viewer),stage=group?.stage;
  if(!pm||pm.inTransaction||viewer.historyManager?.recoverySnapshot||!(group instanceof RigidGroup)||!refs.includes(group)||!pm.stages.includes(stage))throw Error('Choose a current rigid group in a ready sketch.');
  const relations=stage.algNumSystem.allConstraints.filter(c=>c.schema.id==='RigidGroup'&&c.objects[0]===group);
  if(relations.length!==1)throw Error('Rigid group ownership is invalid.');
  const relation=relations[0],members=relation.objects.slice(1);
  if(members.some(member=>!refs.includes(member)||member.stage!==stage))throw Error('Rigid group members changed.');
  assertRigidStageValid(stage,group,members);
  return {pm,stage,relation,members};
}
export function rigidGroupForMember(viewer,member) {
  const refs=current(viewer);
  if(!refs.includes(member)||member.TYPE!=='Segment'||!member.stage)throw Error('Select a current segment in a rigid group.');
  const groups=member.stage.algNumSystem.allConstraints.filter(c=>c.schema.id==='RigidGroup'&&c.objects.slice(1).includes(member));
  if(groups.length!==1)throw Error('Select a segment belonging to exactly one rigid group.');
  resolveGroup(viewer,groups[0].objects[0]);return groups[0].objects[0];
}
function exactPose(group,pose) {
  return Math.abs(group.tx.get()-pose.x)<=1e-6 && Math.abs(group.ty.get()-pose.y)<=1e-6 && Math.abs(group.angle.get()-pose.angle)<=1e-8;
}
function copyPose(input) {
  if(!input||typeof input!=='object'||Array.isArray(input)||Reflect.ownKeys(input).length!==3)throw Error('Invalid rigid pose.');
  const result={};for(const key of ['x','y','angle']){
    const d=Object.getOwnPropertyDescriptor(input,key);
    if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value')||typeof d.value!=='number'||!Number.isFinite(d.value)||Math.abs(d.value)>1e6)throw Error('Invalid rigid pose.');
    result[key]=d.value;
  }
  return result;
}
export function poseRigidGroup(viewer,group,input,beforeSubmit=()=>{}) {
  const pose=copyPose(input),{pm,stage,members}=resolveGroup(viewer,group);
  if(exactPose(group,pose)){beforeSubmit();return {id:group.id,status:'unchanged'};}
  const schema={id:'RigidTemporaryPose',defineParamsScope:([owner],cb)=>owner.visitParams(cb),collectPolynomials:(out,params)=>{
    [pose.x,pose.y,pose.angle].forEach((value,i)=>out.push(new Polynomial(-value).monomial(1).term(params[i],POW_1_FN)));
  }};
  const temporary=new AlgNumConstraint(schema,[group],undefined,true);
  beforeSubmit();
  runSketchTransaction(viewer,{
    mutate:()=>stage.addConstraint(temporary),
    validate:stages=>{
      assertRigidStageValid(stage,group,members);stages.forEach(assertRetainedStageValid);
      if(!exactPose(group,pose))throw Error('The requested rigid pose conflicts with existing constraints.');
      stage.algNumSystem.removeConstraint(temporary);
      assertRigidStageValid(stage,group,members);stages.forEach(assertRetainedStageValid);
      if(!exactPose(group,pose))throw Error('The requested rigid pose cannot be retained.');
    },
  });
  try{pm.refresh();}catch(error){console.error('Rigid pose accepted, but refresh failed:',error);}
  return {id:group.id,status:'accepted'};
}

export function dissolveRigidGroup(viewer,group,beforeSubmit=()=>{}) {
  const {pm,stage,relation,members}=resolveGroup(viewer,group),layer=group.layer;
  if(!layer || !layer.objects.includes(group) || [...group.constraints].some(c=>c!==relation))throw Error('Rigid group has other dependencies.');
  const prior=members.map(member=>JSON.stringify(member.write()));
  beforeSubmit();
  runSketchTransaction(viewer,{
    mutate:()=>{stage.algNumSystem.removeConstraint(relation);if(!layer.remove(group))throw Error('Rigid owner was not removed.');group.layer=null;},
    validate:stages=>{
      if(layer.objects.includes(group)||stage.algNumSystem.allConstraints.includes(relation))throw Error('Rigid group was not dissolved.');
      if(members.some((member,i)=>JSON.stringify(member.write())!==prior[i]))throw Error('Dissolving changed member geometry.');
      stages.forEach(assertRetainedStageValid);
    },
    rollbackExtra:()=>{if(!layer.objects.includes(group)){group.layer=null;stage.assignObject(group);layer.add(group);}},
  });
  try{pm.refresh();}catch(error){console.error('Rigid group dissolved, but refresh failed:',error);}
  return {id:group.id,status:'dissolved'};
}

export async function editRigidGroupById(viewer,id,revision,operation,input,rawOptions={}) {
  const options=optionsCopy(rawOptions),saved=inspections.get(viewer);
  try {
    live(options);
    if(typeof id!=='string'||!id||id.length>256||!saved||saved.revision!==revision)throw Error('Inspect the sketch before running this command.');
    const refs=current(viewer);if(refs.length!==saved.refs.length||refs.some((x,i)=>x!==saved.refs[i]))throw Error('The sketch changed; inspect it again.');
    const group=refs.find(x=>x.id===id);if(!(group instanceof RigidGroup))throw Error('Rigid group is missing.');
    const check=()=>{live(options);revisions.verify(viewer,revision);};
    if(operation==='pose')return poseRigidGroup(viewer,group,input,check);
    if(operation==='dissolve'&&input===undefined)return dissolveRigidGroup(viewer,group,check);
    throw Error('Unsupported rigid group operation.');
  } finally {if(saved?.revision===revision)releaseRigidGroupInspection(viewer,revision);}
}
export async function createRigidGroupByIds(viewer,ids,revision,input={}) {
  const options=optionsCopy(input),saved=inspections.get(viewer);
  try {
    live(options);if(!Array.isArray(ids)||ids.length<2||ids.length>32||ids.some(id=>typeof id!=='string'||!id||id.length>256)||new Set(ids).size!==ids.length)throw Error('Invalid rigid member IDs.');
    if(!saved||saved.revision!==revision)throw Error('Inspect the sketch before running this command.');
    const refs=current(viewer);if(refs.length!==saved.refs.length||refs.some((x,i)=>x!==saved.refs[i]))throw Error('The sketch changed; inspect it again.');
    const members=ids.map(id=>refs.find(x=>x.id===id));if(members.some(x=>!x))throw Error('Rigid member is missing.');
    return createRigidGroup(viewer,members,()=>{live(options);revisions.verify(viewer,revision);});
  } finally {if(saved?.revision===revision)releaseRigidGroupInspection(viewer,revision);}
}
