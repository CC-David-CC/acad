import encoderWorkerUrl from 'codi-controlled-3mf-worker';
import {genericHistoryBuild,requireManufacturingMeshBuild} from 'engine/mount/selectedProfileBuildSelection.mjs';
import {consumeWorkerManufacturingMeshes,discardWorkerManufacturingMeshes} from '../craft/manufacturingMeshReplayResult.mjs';
import {encodeControlledMesh3mfInWorker} from './controlledMesh3mfClient.mjs';

const aborted=Function.call.bind(Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get);
const listen=Function.call.bind(EventTarget.prototype.addEventListener);
const unlisten=Function.call.bind(EventTarget.prototype.removeEventListener);

// Private producer-to-encoder bridge: no caller-supplied meshes or trust flags.
export async function workerGeneric3mf({craft,revision,signal,cancellationSignal,requireCurrent}:{
  craft:any;revision:string;signal:AbortSignal;cancellationSignal?:AbortSignal;requireCurrent:()=>void;
}):Promise<Uint8Array> {
  if(typeof craft?.prepareWorkerManufacturingMeshes!=='function')throw Object.assign(Error('Controlled model export is unavailable.'),{code:'ENGINE_CAPABILITY_UNAVAILABLE'});
  const controller=new AbortController(),stop=()=>controller.abort(),signals=[...new Set([signal,cancellationSignal].filter(s=>s!==undefined))];
  const held:AbortSignal[]=[];
  let token:object=null,batch:any=null,operationFailed=false,operationError:any;
  const checkContext=()=>{requireCurrent();if(aborted(controller.signal)||signals.some(s=>aborted(s)))throw new DOMException('The manufacturing model changed.','AbortError');};
  const check=()=>{checkContext();if(batch&&!batch.isCurrent())throw new DOMException('The manufacturing model changed.','AbortError');};
  try {
    for(const source of signals){held.push(source);listen(source,'abort',stop,{once:true});if(aborted(source))stop();}
    check();
    // Retain this part's exact authored runtime. The protected replay service
    // then binds every assigned current body and requires installed assets;
    // neither this export nor material assignment migrates a saved part.
    const history=craft.modifications$.value,build=genericHistoryBuild(history.history);
    if(!build||build.id!=='occ')throw Object.assign(Error('The authored part has no single controlled manufacturing build.'),{code:'UNSUPPORTED_MANUFACTURING_MESH_BUILD'});
    requireManufacturingMeshBuild(build.id,build.revision);checkContext();
    if(craft.modifications$.value!==history)throw new DOMException('The authored part changed.','AbortError');
    token=await craft.prepareWorkerManufacturingMeshes({revision,engine:'occ',engineRevision:build.revision},
      {signal:controller.signal,valid:()=>{try{checkContext();return true;}catch{return false;}}});
    check();batch=consumeWorkerManufacturingMeshes(token);check();
    if(batch.engine!=='occ'||batch.engineRevision!==build.revision||batch.revision!==revision)throw Object.assign(Error('The issued manufacturing replay differs from the authored part.'),{code:'SOURCE_BINDING_MISMATCH'});
    const url=new URL(encoderWorkerUrl,location.href);
    if(url.origin!==location.origin||url.search||url.hash)throw Error('Invalid manufacturing encoder location.');
    const result=await encodeControlledMesh3mfInWorker({version:1,unit:'millimeter',revision:batch.encodingRevision,
      materials:batch.materials,appearances:batch.appearances,parts:batch.parts,artifacts:batch.artifacts},
      {workerUrl:url.href,signal:controller.signal,valid:()=>{try{check();return true;}catch{return false;}}});
    check();
    // Own standalone output buffer; a view adds no full-file copy.
    return new Uint8Array(result.buffer);
  } catch(cause) {operationFailed=true;operationError=cause;throw cause;}
  finally {
    if(token)discardWorkerManufacturingMeshes(token);
    let failure:any=null;
    for(const source of held)try{unlisten(source,'abort',stop);}catch(cause){if(!failure)failure={cause};}
    if(failure)throw Object.assign(Error('Manufacturing export listener cleanup failed.'),
      {code:'WORKER_CLEANUP_FAILED',cause:failure.cause,operationFailed,operationError,fileCommitted:false});
  }
}
