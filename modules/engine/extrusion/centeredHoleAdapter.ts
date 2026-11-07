import {runPrismSemantic} from './prismSemanticClient';
import semanticWorker from 'codi-prism-semantic-worker';
import {executeCenteredHole} from './candidatePrismLedger.mjs';
import {projectBoundCenteredHole} from 'engine/projection/centeredHoleProjection';
const error=(message:string,code:string)=>Object.assign(new Error(message),{code});
const abort=()=>new DOMException('Centered hole cancelled or superseded.','AbortError');
function capture(value:any,keys:string[]){if(!value||typeof value!=='object'||Array.isArray(value)||Reflect.ownKeys(value).length!==keys.length||Reflect.ownKeys(value).some(k=>typeof k!=='string'||!keys.includes(k)))throw error('Invalid centered-hole input.','INVALID_REQUEST');const out:any={};for(const k of keys){const d=Object.getOwnPropertyDescriptor(value,k);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw error('Centered-hole input must use data properties.','INVALID_REQUEST');out[k]=d.value;}return out;}
function captureIds(value:any){if(!(value instanceof Set)||value.size>16384)throw error('Invalid candidate registry IDs.','INVALID_REQUEST');let size=0;const copy=new Set<string>();for(const id of value){if(typeof id!=='string'||!id||id.length>16384||(size+=id.length)>1048576)throw error('Candidate registry IDs exceed limits.','INVALID_REQUEST');copy.add(id);}return copy;}
export async function runWorkerCenteredThroughHole(input:any){
 const fields=['evaluation','intent','occupiedIds','valid'];if(input&&Object.prototype.hasOwnProperty.call(input,'signal'))fields.push('signal');const a=capture(input,fields),owner=a.evaluation;
 if(!owner||typeof owner.requireCurrent!=='function'||typeof owner.close!=='function'||!owner.signal||typeof a.valid!=='function')throw error('Invalid candidate owner.','INVALID_REQUEST');
 for(const signal of [owner.signal,a.signal].filter(Boolean)){try{Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted')!.get!.call(signal);}catch{throw error('Invalid cancellation signal.','INVALID_REQUEST');}}
 const occupiedIds=captureIds(a.occupiedIds),current=()=>{owner.requireCurrent();if(owner.signal.aborted||a.signal?.aborted||a.valid()!==true)throw abort();owner.requireCurrent();};
 let dispatched=false;try{current();dispatched=true;const result=await executeCenteredHole(owner,a.intent,a.signal?{valid:a.valid,signal:a.signal}:{valid:a.valid});current();result.requireCurrent();
  const workerUrl=new URL(semanticWorker,globalThis.location.href);
  if(workerUrl.origin!==globalThis.location.origin||workerUrl.search||workerUrl.hash)throw error('Invalid semantic worker asset.','INVALID_REQUEST');
  const sideIds=await runPrismSemantic(workerUrl.pathname,{kind:'side-ids',profile:result.profile},{signal:owner.signal,valid:()=>{try{current();result.requireCurrent();return true}catch{return false}},timeoutMs:30000});
  current();result.requireCurrent();
  const projection=projectBoundCenteredHole({sideIds,topology:result.portableTopology,parentTopology:result.parentTopology,parentModel:result.parentModel,intent:result.intent,occupiedIds});result.requireCurrent();projection.checkProjection();result.requireCurrent();
  result.bindProjection(projection.model);
  // The factory installs this guard. It must not call owner.requireCurrent:
  // the owner invokes publication checks inside requireCurrent itself.
  const publicationCheck=()=>{result.publicationCheck();projection.checkProjection();result.publicationCheck();};
  const requireCurrent=()=>{owner.requireCurrent();publicationCheck();owner.requireCurrent();};requireCurrent();
  return Object.freeze({model:projection.model,requireCurrent,publicationCheck});
 }catch(e){if(dispatched)owner.close();throw e;}
}
