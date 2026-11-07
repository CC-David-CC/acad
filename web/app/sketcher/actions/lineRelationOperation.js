import {prepareLineRelation} from './lineRelationAdmission';
import {EndPoint} from '../shapes/point';
import {Segment} from '../shapes/segment';
import {isInstanceOf} from './matchUtils';
import {createSketchRevisionGuard} from './sketchRevisionGuard';
import {runSketchTransaction} from './sketchTransaction';

const revisions=createSketchRevisionGuard(),captures=new WeakMap();
function lifetime(options) {
  if(options.signal?.aborted||(options.valid&&options.valid()!==true))throw Error('The sketch window or account is no longer available.');
}
function targets(viewer) {
  const found=[];
  viewer.traverse(o=>{if(isInstanceOf(o,EndPoint)||isInstanceOf(o,Segment)){if(found.length>=1024)throw Error('Too many sketch targets.');found.push(o);}});
  if(found.some(o=>typeof o.id!=='string'||!o.id||o.id.length>256)||new Set(found.map(o=>o.id)).size!==found.length)throw Error('Sketch target IDs are ambiguous.');
  return found;
}
export async function inspectLineRelationTargets(viewer,options={}) {
  lifetime(options);captures.delete(viewer);const revision=revisions.capture(viewer);
  try {
    const refs=targets(viewer),objects=refs.map(o=>isInstanceOf(o,Segment)?{id:o.id,type:'segment',a:{x:o.a.x,y:o.a.y},b:{x:o.b.x,y:o.b.y}}:{id:o.id,type:'point',x:o.x,y:o.y});
    if(objects.some(o=>o.type==='point'?!Number.isFinite(o.x)||!Number.isFinite(o.y):![o.a.x,o.a.y,o.b.x,o.b.y].every(Number.isFinite)))throw Error('Sketch geometry is invalid.');
    captures.set(viewer,{revision,refs});return {revision,objects};
  } catch(error) {revisions.release(viewer,revision);throw error;}
}
function admit(viewer,kind,objects,beforeSubmit) {
  if(viewer?.historyManager?.recoverySnapshot)throw Error('Choose distinct current targets in a ready sketch and a live direction segment.');
  const pm=viewer?.parametricManager,{constraint:relation,duplicate,validate}=prepareLineRelation(pm,kind,objects);
  const current=targets(viewer);if(objects.some(o=>!current.includes(o)))throw Error('A selected sketch target is no longer current.');
  if(beforeSubmit)beforeSubmit();
  if(duplicate)return {objects:objects.map(o=>o.id),kind,status:'redundant'};
  runSketchTransaction(viewer,{
    mutate:manager=>manager._add(relation),
    validate
  });
  try{pm.refresh()}catch(error){console.error('The relation was accepted, but sketch refresh failed:',error)}
  return {objects:objects.map(o=>o.id),kind,status:relation.stage.algNumSystem.redundant.has(relation)?'redundant':'accepted'};
}
export function addLineRelation(viewer,kind,objects){return admit(viewer,kind,objects,null);}
export async function addLineRelationByIdsAtRevision(viewer,kind,ids,revision,options={}) {
  if(!options||typeof options!=='object'||Array.isArray(options)||Reflect.ownKeys(options).some(k=>typeof k!=='string'||!['signal','valid'].includes(k)))throw Error('Invalid command options.');
  const captured={};for(const key of Reflect.ownKeys(options)){const d=Object.getOwnPropertyDescriptor(options,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw Error('Invalid command options.');captured[key]=d.value;}
  options=captured;if(options.valid!==undefined&&typeof options.valid!=='function')throw Error('Invalid lifetime guard.');
  if(options.signal!==undefined)try{Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get.call(options.signal)}catch{throw Error('Invalid cancellation signal.');}
  lifetime(options);
  if(!['collinear','axis-symmetry'].includes(kind)||!Array.isArray(ids)||ids.length!==(kind==='collinear'?2:3)||Reflect.ownKeys(ids).length!==ids.length+1||
     !Array.from({length:ids.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(ids,String(i));return d?.enumerable&&Object.prototype.hasOwnProperty.call(d,'value')&&typeof d.value==='string'&&d.value.length>0&&d.value.length<=256}).every(Boolean)||ids[0]===ids[1])throw Error('Invalid relation targets.');
  ids=ids.map((_,i)=>Object.getOwnPropertyDescriptor(ids,String(i)).value);
  const saved=captures.get(viewer);if(!saved||saved.revision!==revision)throw Error('Inspect the sketch before running this command.');
  const refs=targets(viewer);if(refs.length!==saved.refs.length||refs.some((o,i)=>o!==saved.refs[i]))throw Error('The sketch changed; inspect it again.');
  const selected=ids.map(id=>refs.find(o=>o.id===id));if(selected.some(o=>!o))throw Error('Sketch target is missing.');
  return admit(viewer,kind,selected,()=>{lifetime(options);if(captures.get(viewer)!==saved)throw Error('The sketch changed; inspect it again.');revisions.verify(viewer,revision);revisions.release(viewer,revision);captures.delete(viewer);});
}
