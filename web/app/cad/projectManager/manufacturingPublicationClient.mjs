import {captureLinkedPartDrawingDefinition,LINKED_DRAWING_MAX_VIEWS,LINKED_DRAWING_MAX_DIMENSIONS,LINKED_DRAWING_MAX_ANNOTATIONS} from '../../../../modules/drawing/linkedPartDrawingDefinition.mjs';
import {bindManufacturingWorkerPreparation} from './documentMetadataPreparation.mjs';
let nextJob=1,failedCleanup=null;
const active=new Set(),LIMIT=8388608;
const nativeAborted=Function.call.bind(Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get);
const addAbortListener=Function.call.bind(EventTarget.prototype.addEventListener);
const removeAbortListener=Function.call.bind(EventTarget.prototype.removeEventListener);
const signalAborted=signal=>signal===undefined?false:nativeAborted(signal);
const fail=(message,code)=>Object.assign(Error(message),{code});
const abort=()=>new DOMException('Manufacturing preparation was cancelled or superseded.','AbortError');
const operationFailure=cause=>cause!==null&&(typeof cause==='object'||typeof cause==='function')?cause:Object.assign(Error('Manufacturing preparation failed.'),{code:'METADATA_PREPARATION_FAILED',cause});
function fields(value,keys){
 if(!value||typeof value!=='object'||Array.isArray(value)||![null,Object.prototype].includes(Object.getPrototypeOf(value)))throw fail('Invalid manufacturing reply.','INVALID_RESPONSE');
 const actual=Reflect.ownKeys(value);if(actual.length!==keys.length||actual.some(k=>typeof k!=='string'||!keys.includes(k)))throw fail('Invalid manufacturing reply fields.','INVALID_RESPONSE');
 const r={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw fail('Manufacturing reply must be own data.','INVALID_RESPONSE');r[key]=d.value;}return r;
}
function healthy(){if(failedCleanup)throw failedCleanup;}
function details(value){
 if(!Array.isArray(value)||value.length>10||Reflect.ownKeys(value).length!==value.length+1)throw fail('Invalid review details.','INVALID_RESPONSE');
 const out=[];for(let i=0;i<value.length;i++){const d=Object.getOwnPropertyDescriptor(value,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value')||typeof d.value!=='string'||d.value.length>1024)throw fail('Review details must be bounded own data.','INVALID_RESPONSE');out.push(d.value);}return Object.freeze(out);
}
function valid(options){if(signalAborted(options.signal)||signalAborted(options.cancellationSignal)||options.valid&&options.valid()!==true)throw abort();if(signalAborted(options.signal)||signalAborted(options.cancellationSignal))throw abort();}
export function assertManufacturingPreparationAvailable(){healthy();}
// Private service transport. Caller supplies captured own inputs; never expose
// returned clone trees or Worker/charge to public command callers.
export function prepareManufacturingInWorker(url,{action,before,args},options={}){
 try{healthy();valid(options);healthy();if(active.size>=4)throw fail('Manufacturing preparation is busy.','BUSY');if(!Number.isSafeInteger(nextJob))throw fail('Manufacturing job IDs are exhausted.','RESOURCE_LIMIT');}
 catch(error){return Promise.reject(operationFailure(error));}
 const id=nextJob++,drawing=action==='drawing'||action==='drawing-travel',travel=action==='travel'||action==='drawing-travel';
 const domain=drawing?'linked-part-drawing':'manufacturing',key=drawing?(travel?args.entry?.key:(before||args.request?.definition)?.drawingId):'manufacturing';
 const binding=travel?{entry:args.entry,direction:args.direction}:{geometryRevision:args.geometryRevision};
 const requestArgs=travel?{entry:binding.entry,direction:binding.direction}:args;
 return new Promise((resolve,reject)=>{
  let worker,timer,done=false;
  const finish=(error,value,failed=true)=>{
   if(done)return;done=true;let cleanup=null;
   const clean=fn=>{try{fn();}catch(cause){if(!cleanup)cleanup=Object.assign(Error('Manufacturing Worker cleanup failed; reload this client module.'),{code:'WORKER_CLEANUP_FAILED',cause,operationError:error,operationFailed:failed});}};
   clean(()=>clearTimeout(timer));clean(()=>options.signal!==undefined&&removeAbortListener(options.signal,'abort',onAbort));clean(()=>options.cancellationSignal!==undefined&&removeAbortListener(options.cancellationSignal,'abort',onAbort));
   if(worker){clean(()=>worker.removeEventListener('message',onMessage));clean(()=>worker.removeEventListener('error',onError));clean(()=>worker.removeEventListener('messageerror',onError));clean(()=>worker.terminate());active.delete(worker);}
   if(cleanup){if(!failedCleanup)failedCleanup=cleanup;reject(cleanup);return;}
   if(failed){reject(operationFailure(error));return;}
   try{
    healthy();valid(options);healthy();
    let after=travel?(binding.direction==='undo'?binding.entry.before:binding.entry.after):value.changed?value.after:before;
    // Structured clone does not freeze. Bounded drawing recapture is required
    // for the public getter; large manufacturing trees remain alias-excluded.
    if(drawing&&travel&&value.changed&&after!==null)after=captureLinkedPartDrawingDefinition(after);
    // Summary counts are derived from the actual prepared/travel/no-op result,
    // never an independently synchronized view-count state or publication grant.
    if(drawing&&(value.summary.viewCount!==(after===null?0:after.views.length)||value.summary.dimensionCount!==(after===null?0:after.dimensions.length)))throw fail('Drawing preparation summary differs from its authored definition.','INVALID_RESPONSE');
    if(drawing){
     const annotated=(after||before)?.version>=3,requirements=(after||before)?.version===4;
     fields(value.summary,['drawingId','viewCount','dimensionCount','quality',...(annotated?['annotationCount']:[]),...(requirements?['datumFeatureCount','requirementCount','requirementRole']:[])]);
     const datumFeatureCount=requirements&&after!==null?after.datumFeatures.length:0,requirementCount=requirements&&after!==null?after.requirements.length:0;
     if(annotated&&value.summary.annotationCount!==((after===null?0:after.annotations.length)+datumFeatureCount+requirementCount))throw fail('Drawing annotation summary differs from its authored definition.','INVALID_RESPONSE');
     if(requirements&&(value.summary.datumFeatureCount!==datumFeatureCount||value.summary.requirementCount!==requirementCount||value.summary.requirementRole!=='authored-manufacturing-requirement'))throw fail('Drawing requirement summary differs from its authored definition.','INVALID_RESPONSE');
    }
    const entry=travel?binding.entry:value.changed?Object.freeze({kind:'document-metadata',version:1,domain,key,before,after,byteSize:value.byteSize}):null;
    resolve(bindManufacturingWorkerPreparation({action,domain,key,changed:value.changed,before,after,entry,direction:travel?binding.direction:null,summary:Object.freeze(value.summary)}));
   }catch(cause){reject(operationFailure(cause));}
  };
  const onAbort=()=>finish(abort()),onError=()=>finish(fail('Manufacturing Worker failed.','METADATA_PREPARATION_FAILED'));
  const onMessage=event=>{
   try{
    const kind=Object.getOwnPropertyDescriptor(event.data||{},'kind')?.value;
    if(kind==='manufacturing-refused'){
     const r=fields(event.data,['kind','version','id','code','message']);
     if(r.version!==1||r.id!==id||typeof r.code!=='string'||!['INVALID_REQUEST','RESOURCE_LIMIT','UNSUPPORTED_METADATA','STALE_ASSIGNMENTS','IDENTITY_CONFLICT','UNSUPPORTED_GROUP','UNSUPPORTED_TARGET','UNKNOWN_MATERIAL','AMBIGUOUS_BINDING','ALIAS_COLLISION','STALE_DOCUMENT','DRAWING_ALREADY_EXISTS','DRAWING_NOT_FOUND','METADATA_PREPARATION_FAILED'].includes(r.code)||typeof r.message!=='string'||r.message.length>1024)throw fail('Invalid manufacturing refusal.','INVALID_RESPONSE');
     finish(fail(r.message,r.code));return;
    }
    const r=fields(event.data,['kind','version','id','action','changed','byteSize','after','summary']);
    if(r.kind!=='manufacturing-prepared'||r.version!==1||r.id!==id||r.action!==action||typeof r.changed!=='boolean'||!Number.isSafeInteger(r.byteSize)||r.byteSize<0||r.byteSize>(drawing?262144:LIMIT)||r.changed!==(r.byteSize>0)||travel&&!r.changed)throw fail('Invalid manufacturing preparation binding.','INVALID_RESPONSE');
    if(travel&&r.byteSize!==binding.entry.byteSize)throw fail('Manufacturing travel charge changed.','INVALID_RESPONSE');
    if(drawing){
     const requirements=Object.hasOwn(r.summary||{},'requirementCount');
     r.summary=fields(r.summary,['drawingId','viewCount','dimensionCount','quality',...(Object.hasOwn(r.summary||{},'annotationCount')?['annotationCount']:[]),...(requirements?['datumFeatureCount','requirementCount','requirementRole']:[])]);
     if(Object.hasOwn(r.summary,'annotationCount')&&(!Number.isInteger(r.summary.annotationCount)||r.summary.annotationCount<0||r.summary.annotationCount>LINKED_DRAWING_MAX_ANNOTATIONS))throw fail('Invalid drawing annotation summary.','INVALID_RESPONSE');
     if(requirements&&(r.summary.requirementRole!=='authored-manufacturing-requirement'||['datumFeatureCount','requirementCount'].some(k=>!Number.isInteger(r.summary[k])||r.summary[k]<0||r.summary[k]>3)||!Object.hasOwn(r.summary,'annotationCount')||r.summary.datumFeatureCount+r.summary.requirementCount>r.summary.annotationCount))throw fail('Invalid drawing requirement summary.','INVALID_RESPONSE');
     if(r.summary.drawingId!==key||r.summary.quality!=='authored-definition-only'||!Number.isInteger(r.summary.viewCount)||r.summary.viewCount<0||r.summary.viewCount>LINKED_DRAWING_MAX_VIEWS||!Number.isInteger(r.summary.dimensionCount)||r.summary.dimensionCount<0||r.summary.dimensionCount>LINKED_DRAWING_MAX_DIMENSIONS)throw fail('Invalid drawing preparation summary.','INVALID_RESPONSE');
    }else{
     r.summary=fields(r.summary,['partCount','regionCount','bindingCount','details','warning']);if(['partCount','regionCount','bindingCount'].some(k=>!Number.isSafeInteger(r.summary[k])||r.summary[k]<0||r.summary[k]>1000000)||typeof r.summary.warning!=='string'||r.summary.warning.length>256)throw fail('Invalid manufacturing summary.','INVALID_RESPONSE');r.summary.details=details(r.summary.details);
    }
    if(travel||!r.changed){if(r.after!==null)throw fail('Unexpected metadata payload.','INVALID_RESPONSE');}
    else if(drawing){
     if(r.after!==null){r.after=captureLinkedPartDrawingDefinition(r.after);if(r.after.drawingId!==key)throw fail('Drawing identity changed.','INVALID_RESPONSE');}
     if((args.request.op==='drawing.remove')!==(r.after===null))throw fail('Drawing operation result changed.','INVALID_RESPONSE');
    }else{r.after=fields(r.after,['version','unit','revision','materials','appearances','bindings','objects']);if(r.after.version!==1||r.after.unit!=='millimeter'||r.after.revision!==binding.geometryRevision||['materials','appearances','bindings','objects'].some(k=>!Array.isArray(r.after[k])))throw fail('Manufacturing payload binding is invalid.','INVALID_RESPONSE');}
    finish(null,r,false);
   }catch(error){finish(error);}
  };
  try{
   healthy();valid(options);healthy();if(active.size>=4)throw fail('Manufacturing preparation is busy.','BUSY');worker=new Worker(url);active.add(worker);
   worker.addEventListener('message',onMessage);worker.addEventListener('error',onError);worker.addEventListener('messageerror',onError);if(options.signal!==undefined)addAbortListener(options.signal,'abort',onAbort,{once:true});if(options.cancellationSignal!==undefined)addAbortListener(options.cancellationSignal,'abort',onAbort,{once:true});timer=setTimeout(()=>finish(fail('Manufacturing preparation timed out.','METADATA_PREPARATION_TIMEOUT')),30000);
   valid(options);worker.postMessage({kind:'prepare-manufacturing',version:1,id,action,before,args:requestArgs});
  }catch(error){finish(error);}
 });
}
