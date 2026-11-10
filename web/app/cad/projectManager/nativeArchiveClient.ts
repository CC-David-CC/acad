import {ArchiveDataReceiver,ARCHIVE_LIMITS as L,ARCHIVE_FORMAT,ARCHIVE_PROFILE,archiveError} from './nativeArchiveFormat.mjs';
import {streamNativeArchiveProject} from './nativeArchiveSource';
import {captureDocumentJobOptions} from './captureDocumentJobOptions.mjs';

const aborted=Function.call.bind(Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get);
const listen=Function.call.bind(EventTarget.prototype.addEventListener),unlisten=Function.call.bind(EventTarget.prototype.removeEventListener);
const blobSize=Function.call.bind(Object.getOwnPropertyDescriptor(Blob.prototype,'size').get);
let cleanupFailure:any=null;
function checkBlob(blob){let size;try{size=blobSize(blob);}catch{throw archiveError('CAD_ARCHIVE_PROTOCOL','Archive result is not an intrinsic Blob.');}if(!Number.isSafeInteger(size)||size<22||size>L.bytes)throw archiveError('CAD_ARCHIVE_RESOURCE_LIMIT','Archive result exceeds 128 MiB.');return size;}
function receipt(value,blob){
  const keys=['format','version','unit','writerProfile','designRevision','entryCount','changedEncodedBytes','reusedCompressedBytes','archiveVerificationBytes','outerBytes'];
  if(!value||typeof value!=='object'||Reflect.ownKeys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key))||value.format!==ARCHIVE_FORMAT||value.version!==1||value.unit!=='millimeter'||value.writerProfile!==ARCHIVE_PROFILE||!/^[a-f0-9]{64}$/.test(value.designRevision)||!Number.isSafeInteger(value.entryCount)||value.entryCount<2||value.entryCount>L.entries||keys.slice(6).some(key=>!Number.isSafeInteger(value[key])||value[key]<0||value[key]>L.bytes)||value.outerBytes!==checkBlob(blob))throw archiveError('CAD_ARCHIVE_PROTOCOL','Invalid native archive receipt.');
  return Object.freeze({...value});
}

// One dedicated codec per document/frame, one operation and one pending output.
// Failed physical termination fences this module; reopening a window can reuse
// the module and is not advertised as clearing the fence.
export function createNativeArchiveOwner(workerUrl:string,lifetime:AbortSignal){
  if(cleanupFailure)throw cleanupFailure;
  aborted(lifetime);
  let worker:Worker=null,closed=false,busy=false,sequence=0,waiting:any=null,active:any=null,prepared:any=null,preparedContent:any=null,ownCleanupFailure:any=null;
  const failCleanup=(cause,operationError)=>{const error=archiveError('WORKER_CLEANUP_FAILED','Native archive Worker cleanup failed; reload this client module.',cause);(error as any).operationError=operationError;cleanupFailure ||= error;return error;};
  function close(...errors:any[]){
    const hasOperationError=errors.length>0,operationError=hasOperationError?errors[0]:null;
    if(closed){if(ownCleanupFailure)throw ownCleanupFailure;return;}closed=true;
    let failure:any=null;
    const clean=action=>{try{action();}catch(cause){failure ||= failCleanup(cause,operationError);}};
    clean(()=>unlisten(lifetime,'abort',onLifetime));
    if(worker){const own=worker;worker=null;clean(()=>unlisten(own,'message',onMessage));clean(()=>unlisten(own,'error',onError));clean(()=>unlisten(own,'messageerror',onError));clean(()=>own.terminate());}
    const pending=waiting;waiting=null;prepared=null;preparedContent=null;
    if(pending)pending.reject(failure||(hasOperationError?operationError:archiveError('CAD_ARCHIVE_CLOSED','Native archive owner closed.')));
    if(failure){ownCleanupFailure=failure;throw failure;}
  }
  const onLifetime=()=>{try{close(new DOMException('Document closed.','AbortError'));}catch{}};
  const onError=()=>{try{close(archiveError('CAD_ARCHIVE_WORKER_FAILED','Native archive Worker failed.'));}catch{}};
  function onMessage(event){
    try{
      if(!waiting||!active||event.data?.seq!==active.seq)throw archiveError('CAD_ARCHIVE_PROTOCOL','Unsolicited native archive reply.');
      const message=event.data;
      if(message.type==='hydrate'){
        if(active.expected!=='decoded'||message.index!==active.hydrationIndex++)throw archiveError('CAD_ARCHIVE_PROTOCOL','Out-of-order archive hydration.');
        active.check();active.receiver.part(message.tokens);active.check();worker.postMessage({seq:active.seq,type:'hydrate-ack',index:message.index});return;
      }
      const pending=waiting;
      if(message.type==='error'){
        const error=archiveError(typeof message.code==='string'&&/^[A-Z][A-Z0-9_]{0,127}$/.test(message.code)?message.code:'CAD_ARCHIVE_INVALID',typeof message.message==='string'?message.message:'Native archive failed.');
        waiting=null;pending.reject(error);try{close(error);}catch{}return;
      }
      if(message.type!==active.expected||active.index!==undefined&&message.index!==active.index)throw archiveError('CAD_ARCHIVE_PROTOCOL','Wrong native archive reply.');
      active.check();waiting=null;pending.resolve(message);
    }catch(error){try{close(error);}catch{}}
  }
  listen(lifetime,'abort',onLifetime,{once:true});if(aborted(lifetime)){close();throw new DOMException('Document closed.','AbortError');}
  function ensure(){
    if(cleanupFailure)throw cleanupFailure;if(closed||aborted(lifetime))throw new DOMException('Document closed.','AbortError');
    if(!worker){worker=new Worker(workerUrl);listen(worker,'message',onMessage);listen(worker,'error',onError);listen(worker,'messageerror',onError);}
  }
  async function operation(options,task){
    if(busy)throw archiveError('CAD_ARCHIVE_BUSY','A native archive operation is already in progress.');
    options=captureDocumentJobOptions(options,true);
    if(busy)throw archiveError('CAD_ARCHIVE_BUSY','A native archive operation is already in progress.');
    ensure();busy=true;const signal=options.signal;
    const check=()=>{if(closed||aborted(lifetime)||signal!==undefined&&aborted(signal)||options.valid&&options.valid()!==true)throw new DOMException('Archive operation is stale or cancelled.','AbortError');if(closed)throw new DOMException('Document closed.','AbortError');};
    const abort=()=>{try{close(new DOMException('Native archive cancelled.','AbortError'));}catch{}};
    let timer,poll,operationError:any=null;
    try{
      if(signal!==undefined)listen(signal,'abort',abort,{once:true});
      timer=setTimeout(()=>{try{close(archiveError('CAD_ARCHIVE_TIMEOUT','Native archive processing exceeded its five-minute deadline.'));}catch{}},300000);
      poll=setInterval(()=>{try{check();}catch(error){try{close(error);}catch{}}},100);
      check();active={seq:++sequence,check,receiver:new ArchiveDataReceiver(),hydrationIndex:0};
      const exchange=(type,expected,fields={})=>{check();if(waiting)throw archiveError('CAD_ARCHIVE_PROTOCOL','Concurrent archive exchange.');active.expected=expected;active.index=(fields as any).index;return new Promise<any>((resolve,reject)=>{waiting={resolve,reject};try{worker.postMessage({seq:active.seq,type,...fields});}catch(error){try{close(error);}catch{}}});};
      const result=await task(exchange,check);check();return result;
    }catch(error){operationError=error;try{close(error);}catch(cause){throw cause;}throw error;
    }finally{
      clearTimeout(timer);clearInterval(poll);let failure:any=null;
      if(signal!==undefined)try{unlisten(signal,'abort',abort);}catch(cause){failure=failCleanup(cause,operationError);}
      active=null;busy=false;if(failure){try{close(failure);}catch{}throw failure;}
    }
  }
  async function encode(source,options){
    if(prepared||preparedContent)throw archiveError('CAD_ARCHIVE_BUSY','Release or commit the previous source preparation first.');
    return operation(options,async(exchange,check)=>{
      await exchange('encode-start','ack');let index=0;
      await streamNativeArchiveProject(source,part=>exchange('part','ack',{part,index:index++}),()=>{check();return true;});
      const preparation=active.seq,result=await exchange('encode-finish','encoded'),meta=receipt(result.receipt,result.blob),token={};prepared=token;
      let released=false,rebased=false;
      return Object.freeze({blob:result.blob,receipt:meta,
        async adoptSavedContent(options){if(released||rebased||prepared!==token)throw archiveError('CAD_ARCHIVE_CLOSED','Archive preparation was released.');await operation(options,exchange=>exchange('archive-content-adopt','archive-content-adopted',{preparation}));},
        async rebase(blob,options){if(released||prepared!==token)throw archiveError('CAD_ARCHIVE_CLOSED','Archive preparation was released.');const bytes=checkBlob(blob),answer=await operation(options,exchange=>exchange('rebase','rebased',{blob}));if(prepared!==token||answer.verifiedBytes!==bytes)throw archiveError('CAD_ARCHIVE_PROTOCOL','Archive preparation changed.');prepared=null;rebased=true;return Object.freeze({verifiedBytes:bytes});},
        async release(){if(released)return;released=true;if(rebased||closed||prepared!==token)return;try{await operation({valid:()=>!aborted(lifetime)},exchange=>exchange('discard','discarded'));}finally{if(prepared===token)prepared=null;}}
      });
    });
  }
  async function prepareContent(source,options,sourceCurrent,forSave=false){
    if(prepared||preparedContent)throw archiveError('CAD_ARCHIVE_BUSY','Release the previous source preparation first.');
    const outcome=await operation(options,async(exchange,check)=>{
      await exchange('content-start','ack');let index=0;
      try{await streamNativeArchiveProject(source,part=>exchange('part','ack',{part,index:index++}),()=>{check();return sourceCurrent();});}
      catch(error){if(sourceCurrent())throw error;await exchange('content-cancel','content-cancelled');return {cancelled:error};}
      if(!sourceCurrent()){await exchange('content-cancel','content-cancelled');return {cancelled:new DOMException('Project changed.','AbortError')};}
      const result=await exchange('content-finish','content-prepared',{forSave});
      if(!sourceCurrent()){await exchange('content-cancel','content-cancelled');return {cancelled:new DOMException('Project changed.','AbortError')};}
      if(result.preparation!==active.seq||!(result.equal===null||typeof result.equal==='boolean'))throw archiveError('CAD_ARCHIVE_PROTOCOL','Invalid saved-content preparation.');
      if(forSave)checkBlob(result.blob);
      const token={preparation:result.preparation};preparedContent=token;let terminal:'pending'|'adopting'|'adopted'|'released'='pending';
      return Object.freeze({equal:result.equal,...(forSave?{blob:result.blob}:{}),
        async adopt(adoptionOptions){
          if(terminal==='adopted')return;
          if(terminal!=='pending'||closed||preparedContent!==token)throw archiveError('CAD_ARCHIVE_CLOSED','Saved-content preparation was released.');
          terminal='adopting';
          try{await operation(adoptionOptions,exchange=>exchange('content-adopt','content-adopted',{preparation:token.preparation}));}catch(error){terminal='released';throw error;}
          if(preparedContent!==token)throw archiveError('CAD_ARCHIVE_PROTOCOL','Saved-content preparation changed.');preparedContent=null;terminal='adopted';
        },
        async release(){
          if(terminal!=='pending')return;terminal='released';
          if(closed||preparedContent!==token)return;
          try{await operation({valid:()=>!aborted(lifetime)},exchange=>exchange('content-discard','content-discarded',{preparation:token.preparation}));}finally{if(preparedContent===token)preparedContent=null;}
        }
      });
    });
    if('cancelled' in outcome)throw outcome.cancelled;return outcome;
  }
  async function decode(blob,options){checkBlob(blob);return operation(options,async exchange=>{await exchange('decode','decoded',{blob});const result=active.receiver.finish();receipt(result.receipt,blob);return result;});}
  return Object.freeze({encode,decode,prepareContent,close,get available(){return !closed&&!cleanupFailure;}});
}
