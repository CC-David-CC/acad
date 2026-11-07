import encoderWorkerUrl from 'codi-controlled-3mf-worker';
import {captureLinkedPartDrawingDefinition} from 'drawing/linkedPartDrawingDefinition.mjs';
const aborted=Function.call.bind(Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get);
const listen=Function.call.bind(EventTarget.prototype.addEventListener),unlisten=Function.call.bind(EventTarget.prototype.removeEventListener);
const bufferBytes=Function.call.bind(Object.getOwnPropertyDescriptor(ArrayBuffer.prototype,'byteLength').get);
// A failed required release fences allocation in this module. Reopening a
// window may reuse this module; only module replacement clears the fence.
let encoderCleanupFailure:Error|null=null;
function healthy(){if(encoderCleanupFailure)throw encoderCleanupFailure;}
function attachedBuffer(value:any,max:number,min=0):void {
  const bytes=bufferBytes(value);new DataView(value);
  if(bytes<min||bytes>max)throw Error('Invalid drawing buffer length.');
}
function fields(value:any,keys:string[]):any {
  if(!value||typeof value!=='object'||Array.isArray(value)||![null,Object.prototype].includes(Object.getPrototypeOf(value))||Reflect.ownKeys(value).length!==keys.length)throw Error('Invalid drawing encoder reply.');
  const out:any={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw Error('Drawing encoder reply must be own data.');out[key]=d.value;}return out;
}
const refusalCodes=['INVALID_REQUEST','RESOURCE_LIMIT','SOURCE_BINDING_MISMATCH','UNKNOWN_MATERIAL_ASSIGNMENT','UNQUALIFIED_REGION_INTERFACE','UNSUPPORTED_MESH_DOMAIN','INVALID_MESH_ARTIFACT','ENCODER_FAILURE'];

// Revision-specific read only. Full projected-value validation/rendering stays
// in the Worker; this client admits bounded metadata and intrinsic buffers.
export async function workerLinkedDrawingSvg({craft,definition,revision,geometryRevision,signal,requireCurrent}:{
  craft:any;definition:any;revision:string;geometryRevision:string;signal:AbortSignal;requireCurrent:()=>void;
}):Promise<Uint8Array> {
  healthy();const d=captureLinkedPartDrawingDefinition(definition);
  const check=()=>{healthy();requireCurrent();healthy();if(aborted(signal))throw new DOMException('Drawing export was cancelled.','AbortError');};
  check();
  const read=await craft.readWorkerLinkedPartDrawing({revision,geometryRevision,definition:d},{signal,valid:()=>{try{check();return true;}catch{return false;}}});
  check();
  if(read.revision!==revision||read.geometryRevision!==geometryRevision||read.drawingId!==d.drawingId||!Array.isArray(read.views)||read.views.length>d.views.length)throw Error('Drawing export observation changed.');
  const url=new URL(encoderWorkerUrl,location.href);
  if(url.origin!==location.origin||url.search||url.hash)throw Error('Invalid drawing encoder location.');
  const transfers:ArrayBuffer[]=[];
  for(const view of read.views)if(view.status==='available') {
    attachedBuffer(view.values,786432);attachedBuffer(view.tags,32768);
    if(transfers.includes(view.values)||transfers.includes(view.tags)||view.values===view.tags)throw Error('Invalid drawing view buffers.');
    transfers.push(view.values,view.tags);
  }
  check();
  return await new Promise((resolve,reject)=>{
    let worker:Worker=null,timer:any,poll:any,settled=false,abortAttempted=false,messageAttempted=false,errorAttempted=false,messageErrorAttempted=false;
    const finish=(value:Uint8Array,error?:any,failed=false)=>{
      if(settled)return;settled=true;
      let cleanup:any=null;
      const clean=(action:()=>void)=>{try{action();}catch(cause){if(cleanup===null)cleanup={cause};}};
      clean(()=>clearTimeout(timer));clean(()=>clearInterval(poll));
      if(abortAttempted)clean(()=>unlisten(signal,'abort',cancel));
      if(worker){
        if(messageAttempted)clean(()=>unlisten(worker,'message',message));
        if(errorAttempted)clean(()=>unlisten(worker,'error',workerError));
        if(messageErrorAttempted)clean(()=>unlisten(worker,'messageerror',workerError));
        clean(()=>worker.terminate());
      }
      if(cleanup!==null){
        const failure=Object.assign(Error('Drawing encoder cleanup failed; reload this client module.'),{code:'WORKER_CLEANUP_FAILED',cause:cleanup.cause,operationError:error,operationFailed:failed,fileCommitted:false});
        if(!encoderCleanupFailure)encoderCleanupFailure=failure;reject(failure);
      }else if(failed)reject(error);else resolve(value);
    };
    const cancel=()=>finish(null,new DOMException('Drawing export was cancelled.','AbortError'),true);
    const workerError=()=>finish(null,Object.assign(Error('Drawing SVG encoder failed.'),{code:'ENCODER_FAILURE'}),true);
    const message=(event:MessageEvent)=>{try{
      check();const kind=Object.getOwnPropertyDescriptor(event.data||{},'kind')?.value;
      if(kind==='linked-part-drawing-refused'){
        const packet=fields(event.data,['kind','seq','binding','code','message']);
        if(packet.seq!==1||packet.binding!==null||!refusalCodes.includes(packet.code)||typeof packet.message!=='string'||packet.message.length>512)throw Error('Invalid drawing refusal.');
        throw Object.assign(Error(packet.message||'Drawing encoder refused.'),{code:packet.code});
      }
      const packet=fields(event.data,['kind','result']),result=fields(packet.result,['format','mime','status','drawingId','revision','geometryRevision','buffer']);
      if(packet.kind!=='linked-part-drawing-svg'||result.format!=='svg'||result.mime!=='image/svg+xml'||result.drawingId!==d.drawingId||result.revision!==revision||result.geometryRevision!==geometryRevision||!['available','unresolved'].includes(result.status))throw Error('Drawing SVG encoder returned an invalid result.');
      attachedBuffer(result.buffer,16*1024*1024,1);finish(new Uint8Array(result.buffer));
    }catch(error){finish(null,error,true);}};
    try{
      check();worker=new Worker(url.href,{type:'module'});
      messageAttempted=true;listen(worker,'message',message);errorAttempted=true;listen(worker,'error',workerError);messageErrorAttempted=true;listen(worker,'messageerror',workerError);
      abortAttempted=true;listen(signal,'abort',cancel,{once:true});check();
      timer=setTimeout(()=>finish(null,new DOMException('Drawing SVG encoder exceeded its deadline.','TimeoutError'),true),30000);
      poll=setInterval(()=>{try{check();}catch(error){finish(null,error,true);}},100);
      check();worker.postMessage({kind:'render-linked-part-drawing',definition:d,read},transfers);
    }catch(error){finish(null,error,true);}
  });
}
