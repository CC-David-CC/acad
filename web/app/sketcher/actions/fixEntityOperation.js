import {prepareFixedEntity} from './fixedEntityAdmission';
import {fixedSchemaFor} from '../constr/fixedEntityDomain.mjs';
import {createSketchRevisionGuard} from './sketchRevisionGuard';
import {runSketchTransaction} from './sketchTransaction';

const revisions=createSketchRevisionGuard(),captures=new WeakMap();
function lifetime(options){if(options.signal?.aborted||(options.valid&&options.valid()!==true))throw Error('The sketch window or account is no longer available.');}
function targets(viewer){
  const found=[];viewer.traverse(o=>{if(o&&typeof o.id==='string'&&o.id){if(found.length>=1024)throw Error('Too many sketch targets.');found.push(o);}});
  if(found.some(o=>o.id.length>256)||new Set(found.map(o=>o.id)).size!==found.length)throw Error('Sketch target IDs are ambiguous.');
  return found;
}
export async function inspectFixEntityTargets(viewer,options={}){
  lifetime(options);captures.delete(viewer);const revision=revisions.capture(viewer);
  try{const refs=targets(viewer),objects=refs.map(o=>({id:o.id,type:o.TYPE||'unknown',supported:!!fixedSchemaFor(o)}));captures.set(viewer,{revision,refs});return {revision,objects};}
  catch(error){revisions.release(viewer,revision);throw error;}
}
export function releaseFixEntityInspection(viewer,revision){
  const saved=captures.get(viewer);
  if(saved?.revision===revision){captures.delete(viewer);revisions.release(viewer,revision);}
}
function admit(viewer,object,beforeSubmit){
  const pm=viewer?.parametricManager;
  if(!pm||pm.inTransaction||viewer.historyManager?.recoverySnapshot||!object?.stage||!pm.stages.includes(object.stage))throw Error('Choose a current entity in a ready sketch.');
  if(!fixedSchemaFor(object))throw Error('Fix supports a segment, circle or arc.');
  if(!targets(viewer).includes(object))throw Error('The selected entity is no longer current.');
  if(object.generator&&object.stage===pm.stage)throw Error('Cannot fix a generated object in the same stage.');
  const prepared=prepareFixedEntity(pm,object),relation=prepared.constraint;
  if(beforeSubmit)beforeSubmit();
  if(prepared.existing)return {objectId:object.id,type:object.TYPE,status:'redundant'};
  runSketchTransaction(viewer,{mutate:manager=>manager._add(relation),validate:prepared.validate});
  try{pm.refresh();}catch(error){console.error('The entity fix was accepted, but sketch refresh failed:',error);}
  return {objectId:object.id,type:object.TYPE,status:relation.stage.algNumSystem.redundant.has(relation)?'redundant':'accepted'};
}
export function fixEntity(viewer,object){return admit(viewer,object,null);}
export async function fixEntityByIdAtRevision(viewer,id,revision,options={}){
  if(!options||typeof options!=='object'||Array.isArray(options)||Reflect.ownKeys(options).some(k=>typeof k!=='string'||!['signal','valid'].includes(k)))throw Error('Invalid command options.');
  const captured={};for(const key of Reflect.ownKeys(options)){const d=Object.getOwnPropertyDescriptor(options,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw Error('Invalid command options.');captured[key]=d.value;}
  options=captured;if(options.valid!==undefined&&typeof options.valid!=='function')throw Error('Invalid lifetime guard.');
  if(options.signal!==undefined)try{Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get.call(options.signal)}catch{throw Error('Invalid cancellation signal.');}
  const saved=captures.get(viewer);
  try{
    lifetime(options);if(typeof id!=='string'||!id||id.length>256)throw Error('Invalid entity ID.');
    if(!saved||saved.revision!==revision)throw Error('Inspect the sketch before running this command.');
    const refs=targets(viewer);if(refs.length!==saved.refs.length||refs.some((o,i)=>o!==saved.refs[i]))throw Error('The sketch changed; inspect it again.');
    const object=refs.find(o=>o.id===id);if(!object)throw Error('Sketch entity is missing.');
    return admit(viewer,object,()=>{lifetime(options);if(captures.get(viewer)!==saved)throw Error('The sketch changed; inspect it again.');revisions.verify(viewer,revision);});
  }finally{if(saved?.revision===revision)releaseFixEntityInspection(viewer,revision);}
}
