import {prepareLengthRelation} from './lengthRelationAdmission';
import {Segment} from '../shapes/segment';
import {isInstanceOf} from './matchUtils';
import {createSketchRevisionGuard} from './sketchRevisionGuard';
import {runSketchTransaction} from './sketchTransaction';

// All authoring paths call this same simultaneous-constraint admission.
export function addLengthRelation(viewer, objects, constants, beforeCommit) {
  const pm=viewer?.parametricManager;
  const {constraint,stage,validate}=prepareLengthRelation(pm,objects,constants);
  if(beforeCommit)beforeCommit();
  runSketchTransaction(viewer,{mutate:()=>pm._add(constraint),validate});
  try{pm.refresh()}catch(error){console.error('Length relation accepted, but sketch refresh failed:',error)}
  return {objects:objects.map(o=>o.id),status:stage.algNumSystem.redundant.has(constraint)?'redundant':'accepted'};
}

const revisionGuard=createSketchRevisionGuard();
function guard(options) {
  if(options?.signal?.aborted||(options?.valid&&options.valid()!==true))throw Error('The sketch window or account is no longer available.');
}
function segments(viewer) {
  if(typeof viewer?.traverse!=='function')throw Error('An active sketch is required.');
  const refs=[];viewer.traverse(o=>{if(isInstanceOf(o,Segment)){if(refs.length>=1024)throw Error('Too many sketch segments.');refs.push(o);}});
  if(refs.some(o=>typeof o.id!=='string'||!o.id||o.id.length>256)||new Set(refs.map(o=>o.id)).size!==refs.length)throw Error('Segment IDs are invalid or ambiguous.');
  return refs;
}
export function inspectLengthRelationTargets(viewer,options={}) {
  guard(options);const revision=revisionGuard.capture(viewer);
  try {
    const pm=viewer.parametricManager,stages=pm.stages,stageRefs=stages.slice();
    const refs=segments(viewer),objects=refs.map(o=>({id:o.id,length:Math.hypot(o.b.x-o.a.x,o.b.y-o.a.y),measurementRole:'reference',unit:'millimeter'}));
    if(objects.some(o=>!Number.isFinite(o.length)))throw Error('Sketch geometry is invalid.');
    const relations=[];for(const stage of viewer.parametricManager.stages)for(const c of stage.algNumSystem.allConstraints){
      if(c.schema.id!=='LengthRelation')continue;
      if(relations.length>=1024)throw Error('Too many length relations.');
      relations.push({role:'driving',objects:c.objects.map(o=>o.id),constants:{...c.constants},status:stage.algNumSystem.redundant.has(c)?'redundant':stage.algNumSystem.isConflicting(c)?'conflicting':'accepted'});
    }
    guard(options);
    const currentRefs=segments(viewer);
    if(viewer.parametricManager!==pm||pm.stages!==stages||stages.length!==stageRefs.length||stages.some((stage,i)=>stage!==stageRefs[i])||currentRefs.length!==refs.length||currentRefs.some((object,i)=>object!==refs[i]))throw Error('The sketch changed; inspect it again.');
    revisionGuard.verify(viewer,revision);return {revision,objects,relations};
  } catch(error) {revisionGuard.release(viewer,revision);throw error;}
}
export function addLengthRelationByIdsAtRevision(viewer,ids,constants,revision,options={}) {
  guard(options);
  const slots=Array.isArray(ids)?[Object.getOwnPropertyDescriptor(ids,'0'),Object.getOwnPropertyDescriptor(ids,'1')]:[];
  if(!Array.isArray(ids)||ids.length!==2||slots.some(d=>!d||!Object.hasOwn(d,'value')||typeof d.value!=='string'||!d.value||d.value.length>256)||slots[0].value===slots[1].value)throw Error('Provide two distinct segment IDs.');
  const factor=constants&&Object.getOwnPropertyDescriptor(constants,'factor'),offset=constants&&Object.getOwnPropertyDescriptor(constants,'offset');
  if(!factor||!offset||!Object.hasOwn(factor,'value')||!Object.hasOwn(offset,'value')||typeof factor.value!=='number'||!Number.isFinite(factor.value)||factor.value<0||typeof offset.value!=='number'||!Number.isFinite(offset.value))throw Error('Provide finite length relation values.');
  const refs=segments(viewer),objects=slots.map(d=>refs.find(o=>o.id===d.value));
  if(objects.some(o=>!o))throw Error('Segment is missing or ambiguous.');
  return addLengthRelation(viewer,objects,{factor:String(factor.value),offset:String(offset.value)},()=>{
    guard(options);revisionGuard.verify(viewer,revision);revisionGuard.release(viewer,revision);
  });
}
