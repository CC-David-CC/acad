import {addSignedDistanceTransition} from './signedDistanceTransition';
import {addLineRelationTransition} from './lineRelationTransition';
// Explicit internal operation whitelist. There is no module name, callback,
// dynamic import or source-evaluation path in a public request.
export function verifyTransitionCandidate(operation:'signed-distance'|'line-relation',request:any){
 let revision='';try{
  const keys=['revision','sketchJSON','externalParameters','intent','candidateJSON','status',...(operation==='line-relation'?['relation']:[])];
  if(!['signed-distance','line-relation'].includes(operation)||!request||typeof request!=='object'||Array.isArray(request)||![Object.prototype,null].includes(Object.getPrototypeOf(request))||Reflect.ownKeys(request).length!==keys.length)throw Error('Invalid candidate verification.');
  const a:any={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(request,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw Error('Verification fields must be data.');a[key]=d.value;}
  if(typeof a.revision==='string'&&a.revision.length<=256)revision=a.revision;
  if(typeof a.candidateJSON!=='string'||a.candidateJSON.length>1048576||new TextEncoder().encode(a.candidateJSON).byteLength>1048576||!['accepted','redundant'].includes(a.status))throw Error('Invalid candidate.');
  const input={revision:a.revision,sketchJSON:a.sketchJSON,externalParameters:a.externalParameters,intent:a.intent},expected=operation==='signed-distance'?addSignedDistanceTransition(input):addLineRelationTransition(input);if(!expected.ok)return expected;
  const status='dimension' in expected?expected.dimension.status:'relation' in expected?expected.relation.status:null;
  if(operation==='line-relation'){
   const value=a.relation,fields=['kind','typeId','objects','stage','index','status','existing'],captured:any={};if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value))||Reflect.ownKeys(value).length!==fields.length)throw Error('Invalid relation receipt.');
   for(const key of fields){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw Error('Relation receipt fields must be data.');captured[key]=d.value;}
   const ids=captured.objects;if(!Array.isArray(ids)||Object.getPrototypeOf(ids)!==Array.prototype||ids.length!==('relation' in expected?expected.relation.objects.length:0)||Reflect.ownKeys(ids).length!==ids.length+1)throw Error('Invalid relation receipt IDs.');captured.objects=Array.from({length:ids.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(ids,String(i));if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value')||typeof d.value!=='string'||d.value.length>256)throw Error('Invalid relation receipt IDs.');return d.value;});
   if(!('relation' in expected)||fields.some(key=>JSON.stringify(captured[key])!==JSON.stringify(expected.relation[key])))throw Error('Relation receipt does not belong to the captured operation.');
  }
  if(!('serializedSketch' in expected)||expected.serializedSketch!==a.candidateJSON||status!==a.status)return {revision,ok:false as const,error:{code:'CANDIDATE_MISMATCH',message:'The returned candidate differs from its captured authored operation.'}};
  return {revision,ok:true as const,verified:true};
 }catch{return {revision,ok:false as const,error:{code:'INVALID_CANDIDATE',message:'The candidate could not be verified.'}};}
}
