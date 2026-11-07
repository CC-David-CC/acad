import {createVerifiedOciMount} from 'engine/mount/oci-verified-mount.mjs';
import {projectValidatedRectanglePrism} from 'engine/projection/rectanglePrismProjection';
import {runPrismSemantic} from './prismSemanticClient';
import {registerCandidatePrism} from './candidatePrismLedger.mjs';

const error=(message:string,code:string)=>Object.assign(new Error(message),{code});
const abortError=()=>new DOMException('Worker prism cancelled or superseded.','AbortError');
const keys=(v:any,names:string[])=>v&&typeof v==='object'&&!Array.isArray(v)&&Reflect.ownKeys(v).sort().join(',')===names.slice().sort().join(',');
function captureRecord(v:any,names:string[]) {if(!keys(v,names))throw error('Invalid prism input.','INVALID_REQUEST');const out:any={};for(const k of names){const d=Object.getOwnPropertyDescriptor(v,k);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw error('Prism input must be data.','INVALID_REQUEST');out[k]=d.value;}return out;}
function captureProfile(value:any) {
 const p=captureRecord(value,['version','unit','engine','revision','sketchDigest','faceId','regionId','frame','depth','sketchJSON']);
 if(![1,2].includes(p.version)||p.unit!=='millimeter'||p.engine!=='occ')throw error('This operation requires an OCC millimeter rectangle.','UNSUPPORTED_CASE');
 if(typeof p.revision!=='string'||!p.revision||p.revision.length>256||typeof p.sketchDigest!=='string'||!/^[a-f0-9]{64}$/.test(p.sketchDigest)||typeof p.faceId!=='string'||!p.faceId||p.faceId.length>256||typeof p.regionId!=='string'||!p.regionId||p.regionId.length>8192||typeof p.sketchJSON!=='string'||p.sketchJSON.length>65536||!Number.isFinite(p.depth)||p.depth<=0||p.depth>1e6)throw error('Invalid bounded rectangle profile.','INVALID_REQUEST');
 const frame=captureRecord(p.frame,['origin','x','y','z']);for(const k of ['origin','x','y','z']){const a=frame[k];if(!Array.isArray(a)||a.length!==3||Reflect.ownKeys(a).sort().join(',')!=='0,1,2,length')throw error('Invalid rectangle frame.','INVALID_REQUEST');frame[k]=[0,1,2].map(i=>{const d=Object.getOwnPropertyDescriptor(a,String(i));if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value')||typeof d.value!=='number'||!Number.isFinite(d.value))throw error('Invalid rectangle frame.','INVALID_REQUEST');return d.value;});}p.frame=frame;return p;
}
function captureAssets(value:any) {const a=captureRecord(value,['workerUrl','jsPath','wasmPath','semanticWorkerUrl']);for(const path of Object.values(a)){if(typeof path!=='string'||!path.startsWith('/')||path.startsWith('//')||/[?#]/.test(path))throw error('Worker assets require same-origin paths.','INVALID_REQUEST');let url:URL;try{url=new URL(path,globalThis.location.origin)}catch{throw error('Invalid worker asset path.','INVALID_REQUEST');}if(url.origin!==globalThis.location.origin||!['http:','https:'].includes(url.protocol))throw error('Worker assets require same-origin paths.','INVALID_REQUEST');}return a;}
function captureIds(value:any):Set<string>{if(!(value instanceof Set)||value.size>16384)throw error('Invalid candidate registry IDs.','INVALID_REQUEST');let size=0;const copy=new Set<string>();for(const id of value){if(typeof id!=='string'||!id||id.length>16384||(size+=id.length)>1048576)throw error('Candidate registry IDs exceed limits.','INVALID_REQUEST');copy.add(id);}return copy;}
export async function runWorkerRectangleExtrusion(input:any) {
 const fields=['evaluation','featureId','profile','bodyPolicy','booleanKind','occupiedIds','assets','valid'];if(input&&Object.prototype.hasOwnProperty.call(input,'signal'))fields.push('signal');const a=captureRecord(input,fields);
 if(a.bodyPolicy!=='separate'||a.booleanKind!=='NONE')throw error('Only a separate non-Boolean OCC prism is supported.','UNSUPPORTED_CASE');
 if(typeof a.featureId!=='string'||!a.featureId||a.featureId.length>256||!a.evaluation||typeof a.evaluation.requireCurrent!=='function'||typeof a.evaluation.getOrCreateMount!=='function'||typeof a.evaluation.addPublicationCheck!=='function'||!a.evaluation.signal||typeof a.valid!=='function')throw error('Invalid evaluation context.','INVALID_REQUEST');
 for(const signal of [a.evaluation.signal,a.signal].filter(Boolean)){try{Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get.call(signal)}catch{throw error('Invalid cancellation signal.','INVALID_REQUEST');}}
 const profile=captureProfile(a.profile),assets=captureAssets(a.assets),occupiedIds=captureIds(a.occupiedIds),evaluation=a.evaluation,valid=a.valid,controller=new AbortController();
 const signals=[evaluation.signal,a.signal].filter(Boolean),stop=()=>controller.abort();for(const s of signals)s.addEventListener('abort',stop,{once:true});if(signals.some(s=>s.aborted))stop();
 const deadline=performance.now()+30000;let timedOut=false;const timer=setTimeout(()=>{timedOut=true;stop();},30000);
 const isValid=()=>{try{return !signals.some(s=>s.aborted)&&valid()===true&&!signals.some(s=>s.aborted)}catch{return false}};
 const current=()=>{evaluation.requireCurrent();if(controller.signal.aborted||(!completed&&performance.now()>=deadline)||!isValid())throw abortError();evaluation.requireCurrent();if(controller.signal.aborted||(!completed&&performance.now()>=deadline))throw abortError();};
 let mount:any,association:any,completed=false;
 const waitReady=(promise:Promise<any>)=>new Promise((resolve,reject)=>{const onAbort=()=>reject(abortError());if(controller.signal.aborted)return onAbort();controller.signal.addEventListener('abort',onAbort,{once:true});promise.then(v=>{controller.signal.removeEventListener('abort',onAbort);resolve(v)},e=>{controller.signal.removeEventListener('abort',onAbort);reject(e)});});
 try{
  current();const preflight=await runPrismSemantic(assets.semanticWorkerUrl,{kind:'prepare',profile},{signal:controller.signal,valid:()=>{try{current();return true}catch{return false}},timeoutMs:Math.max(1,Math.ceil(deadline-performance.now()))});current();if(preflight!==true)throw error('Invalid prism profile preflight.','INVALID_RESPONSE');
  mount=evaluation.getOrCreateMount('occ-prism-v1',()=>createVerifiedOciMount({workerUrl:assets.workerUrl,jsPath:assets.jsPath,wasmPath:assets.wasmPath,timeoutMs:30000}));
  await waitReady(mount.ready);current();
  const result=await mount.execute({op:'solid.profile.extrude',version:1,profile},{researchTopology:{version:1},signal:controller.signal});current();
  const binding={revision:profile.revision,sketchDigest:profile.sketchDigest,faceId:profile.faceId,regionId:profile.regionId};
  // No evaluation.requireCurrent() inside this callback: that method runs the
  // publication checks itself. Recheck after the supplied host guard.
  const publicationCheck=()=>{if(!isValid())throw abortError();mount.assertPortableBinding(result.handle,binding,result.portableTopology);if(!isValid())throw abortError();};
  const requireCurrent=()=>{current();publicationCheck();current();};
  requireCurrent();const roles=await runPrismSemantic(assets.semanticWorkerUrl,{kind:'derive',featureId:a.featureId,profile,result},{signal:controller.signal,valid:()=>{try{requireCurrent();return true}catch{return false}},timeoutMs:Math.max(1,Math.ceil(deadline-performance.now()))});requireCurrent();
  if(!roles||roles.binding?.featureId!==a.featureId||roles.binding.revision!==binding.revision||roles.binding.sketchDigest!==binding.sketchDigest||roles.binding.faceId!==binding.faceId||roles.binding.regionId!==binding.regionId||!keys(roles.engineBinding,['mountId','generation','representation','id'])||['mountId','generation','representation','id'].some(k=>roles.engineBinding[k]!==result.handle[k]))throw error('Prism semantic response does not match the source.','INVALID_RESPONSE');
  const projection=projectValidatedRectanglePrism({topology:result.portableTopology,roles},occupiedIds);if(projection.durableIds.some((id:string)=>id.length>1024))throw error('A generated reference exceeds the native project limit.','REFERENCE_LIMIT');
  requireCurrent();association=registerCandidatePrism({owner:evaluation,mount,model:projection.model,featureId:a.featureId,profile,handle:result.handle,topology:result.portableTopology});requireCurrent();evaluation.addPublicationCheck('rectangle-prism:'+a.featureId,publicationCheck);requireCurrent();completed=true;return {model:projection.model,requireCurrent};
 }catch(e){association?.discard();if(mount)mount.close();if(timedOut)throw error('Worker prism timed out.','TIMEOUT');throw e;}finally{clearTimeout(timer);for(const s of signals)s.removeEventListener('abort',stop);}
}
