// Byte-format adapter only. Account/version/CAS authority remains in the
// existing document operation and verified file snapshot services.
const size=Function.call.bind(Object.getOwnPropertyDescriptor(Blob.prototype,'size').get);
export const NATIVE_PROJECT_EXTENSIONS=Object.freeze(['.cad','.jsketcher.json']);
export function nativeProjectFormat(path){
  if(typeof path==='string'&&/\.cad$/i.test(path))return 'cad';
  if(typeof path==='string'&&/\.jsketcher\.json$/i.test(path))return 'json';
  throw Error('Choose a native .cad project (or an explicit historical .jsketcher.json file).');
}
export function requireNativeArchive(manager){
  if(typeof manager?.prepareHostNativeArchive!=='function'||typeof manager?.restoreNativeArchiveBytesInEmptyWorkspace!=='function'||typeof manager?.closeNativeArchive!=='function')throw Error('This CAD runtime has no staged native .cad Worker.');
}
export function nativeProjectExtensions(manager){
  try{requireNativeArchive(manager);return [...NATIVE_PROJECT_EXTENSIONS];}catch{return ['.jsketcher.json'];}
}
export async function restoreNativeProjectFile(manager,path,blob,options){
  if(nativeProjectFormat(path)==='cad'){requireNativeArchive(manager);return manager.restoreNativeArchiveBytesInEmptyWorkspace(blob,options);}
  if(typeof manager?.restoreSnapshotBytesInEmptyWorkspace!=='function')throw Error('This CAD runtime cannot validate native file snapshots.');
  return manager.restoreSnapshotBytesInEmptyWorkspace(blob,options);
}
export function createNativeProjectBackings(){
  const retained=new WeakMap();
  function replace(frame,file){
    if(!file||typeof file.release!=='function')throw Error('A verified native file lease is required.');
    const prior=retained.get(frame);retained.set(frame,file);
    if(prior&&prior!==file)prior.release();
  }
  function close(frame){
    const lease=retained.get(frame);
    // Never claim the source lease was retired while codec termination is
    // uncertain. The client latches that exact failure and fences allocation.
    try{frame?.contentWindow?.__CAD_APP?.projectManager?.closeNativeArchive?.();}catch(cause){throw Object.assign(Error('Native archive Worker cleanup failed; its backing remains owned.'),{code:'WORKER_CLEANUP_FAILED',cause});}
    retained.delete(frame);lease?.release();
  }
  return Object.freeze({replace,close});
}
export function validateNativeArchivePreparation(capture){
  if(!capture||typeof capture.isCurrent!=='function'||typeof capture.release!=='function'||typeof capture.rebase!=='function')throw Error('Invalid native archive preparation.');
  let bytes;try{bytes=size(capture.blob);}catch{throw Error('The native archive Worker did not return a file.');}
  if(!Number.isSafeInteger(bytes)||bytes<22||bytes>128*1024*1024)throw Error('The native archive exceeds 128 MiB.');
  if(capture.receipt?.format!=='codi-cad-project'||capture.receipt.version!==1||capture.receipt.unit!=='millimeter'||capture.receipt.outerBytes!==bytes)throw Error('Invalid native archive receipt.');
  return capture;
}
