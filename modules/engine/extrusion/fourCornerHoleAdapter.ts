import {executeFourCornerHoles} from './candidatePrismLedger.mjs';
import {projectBoundFourCornerHoles} from 'engine/projection/fourCornerHoleProjection';
const error=(message:string)=>Object.assign(new Error(message),{code:'INVALID_REQUEST'});
const abort=()=>new DOMException('Corner holes cancelled or superseded.','AbortError');
function capture(value:any,keys:string[]){if(!value||typeof value!=='object'||Array.isArray(value)||Reflect.ownKeys(value).length!==keys.length||Reflect.ownKeys(value).some(k=>typeof k!=='string'||!keys.includes(k)))throw error('Invalid corner-hole input.');const out:any={};for(const k of keys){const d=Object.getOwnPropertyDescriptor(value,k);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw error('Corner-hole input must use data properties.');out[k]=d.value;}return out;}
function captureIds(value:any){if(!(value instanceof Set)||value.size>16384)throw error('Invalid candidate registry IDs.');let size=0;const copy=new Set<string>();for(const id of value){if(typeof id!=='string'||!id||id.length>16384||(size+=id.length)>1048576)throw error('Candidate registry IDs exceed limits.');copy.add(id);}return copy;}
export async function runWorkerFourCornerHoles(input:any){
 const keys=['evaluation','intent','occupiedIds','valid'];if(input&&Object.prototype.hasOwnProperty.call(input,'signal'))keys.push('signal');const a=capture(input,keys),owner=a.evaluation;
 if(!owner||typeof owner.requireCurrent!=='function'||typeof owner.close!=='function'||!owner.signal||typeof a.valid!=='function')throw error('Invalid candidate owner.');
 for(const signal of [owner.signal,a.signal].filter(Boolean)){try{Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted')!.get!.call(signal);}catch{throw error('Invalid cancellation signal.');}}
 const occupiedIds=captureIds(a.occupiedIds),current=()=>{owner.requireCurrent();if(owner.signal.aborted||a.signal?.aborted||a.valid()!==true)throw abort();owner.requireCurrent();};
 let dispatched=false;try{current();dispatched=true;const result=await executeFourCornerHoles(owner,a.intent,a.signal?{valid:a.valid,signal:a.signal}:{valid:a.valid});current();result.requireCurrent();
  const projection=projectBoundFourCornerHoles({topology:result.portableTopology,parentTopology:result.parentTopology,parentModel:result.parentModel,intent:result.intent,occupiedIds});result.requireCurrent();projection.checkProjection();result.requireCurrent();
  const publicationCheck=()=>{result.publicationCheck();projection.checkProjection();result.publicationCheck();};
  const requireCurrent=()=>{owner.requireCurrent();publicationCheck();owner.requireCurrent();};requireCurrent();
  return Object.freeze({model:projection.model,requireCurrent,publicationCheck});
 }catch(e){if(dispatched)owner.close();throw e;}
}
