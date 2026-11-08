import {prepareRadius} from './radiusAdmission';
import {Circle} from '../shapes/circle';
import {Arc} from '../shapes/arc';
import {isInstanceOf} from './matchUtils';
import {createSketchRevisionGuard} from './sketchRevisionGuard';
import {runSketchTransaction} from './sketchTransaction';

const snapshots=new WeakMap(), revisions=createSketchRevisionGuard();
const nativeAborted=Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get;
function guard(options){if(options?.signal&&nativeAborted.call(options.signal)||(options?.valid&&options.valid()!==true)||options?.signal&&nativeAborted.call(options.signal))throw Error('The sketch window or account is no longer available.');}
function circles(viewer){
 const values=[];viewer.traverse(object=>{if(isInstanceOf(object,Circle)||isInstanceOf(object,Arc)){if(values.length>=1024)throw Error('Too many sketch objects.');values.push(object);}});
 if(values.some(o=>typeof o.id!=='string'||!o.id||o.id.length>256)||new Set(values.map(o=>o.id)).size!==values.length)throw Error('Sketch object IDs are ambiguous.');return values;
}
export async function inspectRadiusTargets(viewer,options={}){
 guard(options);snapshots.delete(viewer);const token=revisions.capture(viewer);
 try{
  const refs=circles(viewer),objects=refs.map(o=>({id:o.id,type:isInstanceOf(o,Circle)?'circle':'arc',radius:o.r.get()}));
  if(objects.some(o=>!Number.isFinite(o.radius)||o.radius<=0))throw Error('Sketch geometry is invalid.');
  guard(options);revisions.verify(viewer,token);snapshots.set(viewer,{token,refs});return {revision:token,objects};
 }catch(error){revisions.release(viewer,token);throw error;}
}
function admitRadius(viewer,object,radius,beforeSubmit){
 const pm=viewer?.parametricManager;
 if(!pm||pm.inTransaction||!object||!(isInstanceOf(object,Circle)||isInstanceOf(object,Arc))||!object.stage||!pm.stages.includes(object.stage)||object.generator&&object.stage===pm.stage||!circles(viewer).includes(object))throw Error('Choose one current circle or arc and a positive bounded radius.');
 const {constraint,validate}=prepareRadius(pm,object,radius);
 if(beforeSubmit)beforeSubmit();
 runSketchTransaction(viewer,{
  mutate:()=>pm._add(constraint),
  validate
 });
 try{pm.refresh();}catch(error){console.error('Radius was accepted, but sketch refresh failed:',error);}
 return {objectId:object.id,status:constraint.stage.algNumSystem.redundant.has(constraint)?'redundant':'accepted'};
}
export function addRadius(viewer,object,radius){return admitRadius(viewer,object,radius,null);}
export async function addRadiusByIdAtRevision(viewer,id,radius,token,options={}){
 if(!options||typeof options!=='object'||Array.isArray(options)||Reflect.ownKeys(options).some(k=>typeof k!=='string'||!['signal','valid'].includes(k)))throw Error('Invalid command options.');
 const captured={};for(const key of Reflect.ownKeys(options)){const d=Object.getOwnPropertyDescriptor(options,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw Error('Invalid command options.');captured[key]=d.value;}options=captured;
 if(options.valid!==undefined&&typeof options.valid!=='function')throw Error('Invalid lifetime guard.');
 if(options.signal!==undefined)try{Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get.call(options.signal)}catch{throw Error('Invalid cancellation signal.');}
 guard(options);if(typeof id!=='string'||!id||id.length>256||typeof radius!=='number'||!Number.isFinite(radius)||radius<=0||radius>1e6)throw Error('A current circle or arc and positive bounded radius are required.');
 const saved=snapshots.get(viewer);if(typeof token!=='string'||!saved||token!==saved.token)throw Error('Inspect the sketch before running this command.');
 const refs=circles(viewer);if(refs.length!==saved.refs.length||refs.some((o,i)=>o!==saved.refs[i]))throw Error('The sketch changed; inspect it again.');
 const matches=refs.filter(o=>o.id===id);if(matches.length!==1)throw Error('Choose one current circle or arc.');
 return admitRadius(viewer,matches[0],radius,()=>{guard(options);if(snapshots.get(viewer)!==saved)throw Error('The sketch changed; inspect it again.');revisions.verify(viewer,token);revisions.release(viewer,token);snapshots.delete(viewer);});
}

// Preserve the editor's existing multi-selection semantics in ONE transaction.
// Every actual target is prepared before mutation; no partially accepted batch.
export function addRadiusBatch(viewer,objects,radius){
 const pm=viewer?.parametricManager,owned=circles(viewer);
 if(!Array.isArray(objects)||!objects.length||objects.length>1024||new Set(objects).size!==objects.length||objects.some(o=>!owned.includes(o)))throw Error('Choose current distinct Circle or Arc objects.');
 const prepared=objects.map(object=>prepareRadius(pm,object,radius));
 runSketchTransaction(viewer,{mutate:()=>{for(const row of prepared)pm._add(row.constraint);},validate:stages=>{for(const row of prepared)row.validate(stages);}});
 try{pm.refresh();}catch(error){console.error('Radii were accepted, but sketch refresh failed:',error);}
 return prepared.map(({constraint})=>({objectId:constraint.objects[0].id,status:constraint.stage.algNumSystem.redundant.has(constraint)?'redundant':'accepted'}));
}
