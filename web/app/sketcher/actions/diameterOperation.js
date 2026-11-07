import {prepareDiameter} from './diameterAdmission';
import {Circle} from '../shapes/circle';
import {Arc} from '../shapes/arc';
import {isInstanceOf} from './matchUtils';
import {createSketchRevisionGuard} from './sketchRevisionGuard';
import {runSketchTransaction} from './sketchTransaction';

const snapshots=new WeakMap(), revisions=createSketchRevisionGuard();
function guard(options){if(options?.signal?.aborted||(options?.valid&&options.valid()!==true))throw Error('The sketch window or account is no longer available.');}
function circles(viewer){
 const values=[];viewer.traverse(object=>{if(isInstanceOf(object,Circle)||isInstanceOf(object,Arc)){if(values.length>=1024)throw Error('Too many sketch objects.');values.push(object);}});
 if(values.some(o=>typeof o.id!=='string'||!o.id||o.id.length>256)||new Set(values.map(o=>o.id)).size!==values.length)throw Error('Sketch object IDs are ambiguous.');return values;
}
export async function inspectDiameterTargets(viewer,options={}){
 guard(options);snapshots.delete(viewer);const token=revisions.capture(viewer);
 try{
  const refs=circles(viewer),objects=refs.map(o=>({id:o.id,type:isInstanceOf(o,Circle)?'circle':'arc',diameter:2*o.r.get()}));
  if(objects.some(o=>!Number.isFinite(o.diameter)||o.diameter<=0))throw Error('Sketch geometry is invalid.');
  guard(options);revisions.verify(viewer,token);snapshots.set(viewer,{token,refs});return {revision:token,objects};
 }catch(error){revisions.release(viewer,token);throw error;}
}
function admitDiameter(viewer,object,diameter,beforeSubmit){
 const pm=viewer?.parametricManager;
 if(!pm||pm.inTransaction||!object||!(isInstanceOf(object,Circle)||isInstanceOf(object,Arc))||!object.stage||!pm.stages.includes(object.stage)||object.generator&&object.stage===pm.stage||!circles(viewer).includes(object))throw Error('Choose one current circle or arc and a positive bounded diameter.');
 const {constraint,validate}=prepareDiameter(pm,object,diameter);
 if(beforeSubmit)beforeSubmit();
 runSketchTransaction(viewer,{
  mutate:()=>pm._add(constraint),
  validate
 });
 try{pm.refresh();}catch(error){console.error('Diameter was accepted, but sketch refresh failed:',error);}
 return {objectId:object.id,status:constraint.stage.algNumSystem.redundant.has(constraint)?'redundant':'accepted'};
}
export function addDiameter(viewer,object,diameter){return admitDiameter(viewer,object,diameter,null);}
export async function addDiameterByIdAtRevision(viewer,id,diameter,token,options={}){
 if(!options||typeof options!=='object'||Array.isArray(options)||Reflect.ownKeys(options).some(k=>typeof k!=='string'||!['signal','valid'].includes(k)))throw Error('Invalid command options.');
 const captured={};for(const key of Reflect.ownKeys(options)){const d=Object.getOwnPropertyDescriptor(options,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw Error('Invalid command options.');captured[key]=d.value;}options=captured;
 if(options.valid!==undefined&&typeof options.valid!=='function')throw Error('Invalid lifetime guard.');
 if(options.signal!==undefined)try{Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get.call(options.signal)}catch{throw Error('Invalid cancellation signal.');}
 guard(options);if(typeof id!=='string'||!id||id.length>256||typeof diameter!=='number'||!Number.isFinite(diameter)||diameter<=0||diameter>1e6)throw Error('A current circle or arc and positive bounded diameter are required.');
 const saved=snapshots.get(viewer);if(typeof token!=='string'||!saved||token!==saved.token)throw Error('Inspect the sketch before running this command.');
 const refs=circles(viewer);if(refs.length!==saved.refs.length||refs.some((o,i)=>o!==saved.refs[i]))throw Error('The sketch changed; inspect it again.');
 const matches=refs.filter(o=>o.id===id);if(matches.length!==1)throw Error('Choose one current circle or arc.');
 return admitDiameter(viewer,matches[0],diameter,()=>{guard(options);if(snapshots.get(viewer)!==saved)throw Error('The sketch changed; inspect it again.');revisions.verify(viewer,token);revisions.release(viewer,token);snapshots.delete(viewer);});
}
