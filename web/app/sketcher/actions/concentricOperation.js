import {prepareConcentric} from './concentricAdmission';
import {Circle} from '../shapes/circle';
import {Arc} from '../shapes/arc';
import {isInstanceOf} from './matchUtils';
import {createSketchRevisionGuard} from './sketchRevisionGuard';
import {runSketchTransaction} from './sketchTransaction';

const revisions=createSketchRevisionGuard(),commandViews=new WeakMap();
function guard(options) {
  if(options?.signal?.aborted||(options?.valid&&options.valid()!==true))throw Error('The sketch window or account is no longer available.');
}
function concentricObjects(viewer) {
  if(typeof viewer?.traverse!=='function')throw Error('An active sketch is required.');
  const objects=[];
  viewer.traverse(object=>{
    if(isInstanceOf(object,Circle)||isInstanceOf(object,Arc)) {
      if(objects.length>=1024)throw Error('Too many sketch objects for this command.');
      objects.push(object);
    }
  });
  if(objects.some(o=>typeof o.id!=='string'||!o.id||o.id.length>256)||new Set(objects.map(o=>o.id)).size!==objects.length)throw Error('Sketch object IDs are invalid or ambiguous.');
  return objects;
}
// Selection UI and the revision-bound ID command use the same atomic model edit.
function admit(viewer,objects,beforeSubmit) {
  const pm=viewer?.parametricManager;
  if(!pm||pm.inTransaction||!Array.isArray(objects)||objects.length!==2||objects[0]===objects[1]||!objects[0]?.id||objects[0].id===objects[1]?.id)throw Error('Choose two distinct circles or arcs in an active sketch.');
  if(objects.some(o=>!o||!(isInstanceOf(o,Circle)||isInstanceOf(o,Arc))||!o.stage||!pm.stages.includes(o.stage)))throw Error('Choose two circles or arcs in this sketch.');
  const current=concentricObjects(viewer);
  if(objects.some(o=>!current.includes(o)))throw Error('Sketch object is missing or ambiguous.');
  const {constraint:relation,stage,validate}=prepareConcentric(pm,objects);
  if(beforeSubmit)beforeSubmit();
  runSketchTransaction(viewer,{
    mutate:()=>pm._add(relation),
    validate
  });
  try{pm.refresh();}catch(error){console.error('Concentric constraint accepted, but sketch refresh failed:',error);}
  return {objects:objects.map(o=>o.id),status:stage.algNumSystem.redundant.has(relation)?'redundant':'accepted'};
}
export function addConcentric(viewer,objects){return admit(viewer,objects,null);}
export function addConcentricByIds(viewer,ids) {
  if(!Array.isArray(ids)||ids.length!==2||ids.some(id=>typeof id!=='string'||!id||id.length>256)||ids[0]===ids[1])throw Error('Provide two distinct sketch object IDs.');
  const refs=concentricObjects(viewer),selected=ids.map(id=>refs.find(o=>o.id===id));
  if(selected.some(o=>!o))throw Error('Sketch object is missing or ambiguous.');
  return addConcentric(viewer,selected);
}
export async function inspectConcentricTargets(viewer,options={}) {
  guard(options);commandViews.delete(viewer);const revision=revisions.capture(viewer);
  try {
    const refs=concentricObjects(viewer),relations=[];
    for(const stage of viewer.parametricManager.stages)for(const constraint of stage.algNumSystem.allConstraints){
      if(constraint.schema.id!=='Concentric')continue;
      if(relations.length>=1024)throw Error('Too many relationships for this command.');
      relations.push({objects:constraint.objects.map(o=>o.id),status:stage.algNumSystem.redundant.has(constraint)?'redundant':stage.algNumSystem.isConflicting(constraint)?'conflicting':'accepted'});
    }
    const objects=refs.map(o=>({id:o.id,type:isInstanceOf(o,Circle)?'circle':'arc',center:{x:o.c.x,y:o.c.y},radius:o.r.get()}));
    if(objects.some(o=>![o.center.x,o.center.y,o.radius].every(Number.isFinite)))throw Error('Sketch geometry is invalid.');
    guard(options);revisions.verify(viewer,revision);commandViews.set(viewer,{revision,refs});return {revision,objects,relations};
  }catch(error){revisions.release(viewer,revision);throw error;}
}
export async function addConcentricByIdsAtRevision(viewer,ids,revision,rawOptions={}) {
  if(!rawOptions||typeof rawOptions!=='object'||Array.isArray(rawOptions)||Reflect.ownKeys(rawOptions).some(k=>typeof k!=='string'||!['signal','valid'].includes(k)))throw Error('Invalid command options.');
  const options={};for(const key of Reflect.ownKeys(rawOptions)){const d=Object.getOwnPropertyDescriptor(rawOptions,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw Error('Invalid command options.');options[key]=d.value;}
  if(options.valid!==undefined&&typeof options.valid!=='function')throw Error('Invalid lifetime guard.');
  if(options.signal!==undefined)try{Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get.call(options.signal)}catch{throw Error('Invalid cancellation signal.');}
  guard(options);
  if(!Array.isArray(ids)||ids.length!==2||Reflect.ownKeys(ids).length!==3||!Array.from({length:2},(_,i)=>{const d=Object.getOwnPropertyDescriptor(ids,String(i));return d?.enumerable&&Object.prototype.hasOwnProperty.call(d,'value')&&typeof d.value==='string'&&d.value.length>0&&d.value.length<=256}).every(Boolean)||ids[0]===ids[1])throw Error('Provide two distinct sketch object IDs.');
  ids=ids.map((_,i)=>Object.getOwnPropertyDescriptor(ids,String(i)).value);
  const saved=commandViews.get(viewer);if(!saved||saved.revision!==revision)throw Error('Inspect the sketch before running this command.');
  const refs=concentricObjects(viewer);if(refs.length!==saved.refs.length||refs.some((o,i)=>o!==saved.refs[i]))throw Error('The sketch changed; inspect it again.');
  const selected=ids.map(id=>refs.find(o=>o.id===id));if(selected.some(o=>!o))throw Error('Sketch object is missing or ambiguous.');
  return admit(viewer,selected,()=>{guard(options);if(commandViews.get(viewer)!==saved)throw Error('The sketch changed; inspect it again.');revisions.verify(viewer,revision);revisions.release(viewer,revision);commandViews.delete(viewer);});
}
