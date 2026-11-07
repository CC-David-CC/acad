import {prepareSignedDistance} from './signedDistanceAdmission';
import {EndPoint} from '../shapes/point';
import {Segment} from '../shapes/segment';
import {isInstanceOf} from './matchUtils';
import {createSketchRevisionGuard} from './sketchRevisionGuard';
import {runSketchTransaction} from './sketchTransaction';

const snapshots=new WeakMap(), revisions=createSketchRevisionGuard();
function guard(options) {
  if(options?.signal?.aborted || (options?.valid && options.valid()!==true))throw Error('The sketch window or account is no longer available.');
}
function targets(viewer) {
  const found=[];viewer.traverse(object=>{if(isInstanceOf(object,EndPoint)||isInstanceOf(object,Segment)){if(found.length>=1024)throw Error('Too many sketch targets.');found.push(object);}});
  if(found.some(o=>typeof o.id!=='string'||!o.id||o.id.length>256)||new Set(found.map(o=>o.id)).size!==found.length)throw Error('Sketch target IDs are ambiguous.');
  return found;
}
export async function inspectSignedDistanceTargets(viewer,options={}) {
  guard(options);snapshots.delete(viewer);const token=revisions.capture(viewer);
  try {
    const refs=targets(viewer),objects=refs.map(o=>isInstanceOf(o,Segment)?{id:o.id,type:'segment',a:{x:o.a.x,y:o.a.y},b:{x:o.b.x,y:o.b.y}}:{id:o.id,type:'point',x:o.x,y:o.y});
    if(objects.some(o=>o.type==='point'?!Number.isFinite(o.x)||!Number.isFinite(o.y):![o.a.x,o.a.y,o.b.x,o.b.y].every(Number.isFinite)))throw Error('Sketch geometry is invalid.');
    snapshots.set(viewer,{token,refs});return {revision:token,objects};
  } catch(error) { revisions.release(viewer,token);throw error; }
}
function admitSignedDistance(viewer,axis,objects,distance,beforeSubmit) {
  const pm=viewer?.parametricManager;
  const {constraint:relation,validate}=prepareSignedDistance(pm,axis,objects,distance);
  const current=targets(viewer);
  if(objects.some(o=>!current.includes(o)))throw Error('A selected sketch target is no longer current.');
  if(beforeSubmit)beforeSubmit();
  runSketchTransaction(viewer,{
    mutate:()=>pm._add(relation),
    validate
  });
  try{pm.refresh()}catch(error){console.error('Signed distance was accepted, but sketch refresh failed:',error)}
  return {objects:objects.map(o=>o.id),axis,status:relation.stage.algNumSystem.redundant.has(relation)?'redundant':'accepted'};
}
export function addSignedDistance(viewer,axis,objects,distance) {
  return admitSignedDistance(viewer,axis,objects,distance,null);
}
export async function addSignedDistanceByIdsAtRevision(viewer,axis,ids,distance,token,options={}) {
  if(!options||typeof options!=='object'||Array.isArray(options)||Reflect.ownKeys(options).some(k=>typeof k!=='string'||!['signal','valid'].includes(k)))throw Error('Invalid command options.');
  const captured={};for(const key of Reflect.ownKeys(options)){const d=Object.getOwnPropertyDescriptor(options,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw Error('Invalid command options.');captured[key]=d.value;}
  options=captured;
  if(options.valid!==undefined&&typeof options.valid!=='function')throw Error('Invalid lifetime guard.');
  if(options.signal!==undefined)try{Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get.call(options.signal)}catch{throw Error('Invalid cancellation signal.')}
  guard(options);
  if(!['x','y','projected'].includes(axis)||!Array.isArray(ids)||ids.length!==(axis==='projected'?3:2)||Reflect.ownKeys(ids).length!==ids.length+1||
     !Array.from({length:ids.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(ids,String(i));return d?.enumerable&&Object.prototype.hasOwnProperty.call(d,'value')&&typeof d.value==='string'&&d.value.length>0&&d.value.length<=256}).every(Boolean)||
     ids[0]===ids[1]||typeof distance!=='number'||!Number.isFinite(distance)||Math.abs(distance)>1e6)throw Error('Invalid signed distance.');
  ids=ids.map((_,i)=>Object.getOwnPropertyDescriptor(ids,String(i)).value);
  const saved=snapshots.get(viewer);if(!saved||saved.token!==token)throw Error('Inspect the sketch before running this command.');
  const refs=targets(viewer);if(refs.length!==saved.refs.length||refs.some((o,i)=>o!==saved.refs[i]))throw Error('The sketch changed; inspect it again.');
  const selected=ids.map(id=>refs.find(o=>o.id===id));if(selected.some(o=>!o))throw Error('Sketch point is missing.');
  return admitSignedDistance(viewer,axis,selected,distance,()=>{
    guard(options);
    if(snapshots.get(viewer)!==saved)throw Error('The sketch changed; inspect it again.');
    revisions.verify(viewer,token);
    revisions.release(viewer,token);snapshots.delete(viewer);
  });
}
