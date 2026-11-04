// The file service owns snapshot integrity. This boundary checks size, version
// and account ownership before the CAD application consumes a snapshot.
export async function readVersionedBytes(files,path,{maximumBytes,valid=()=>true,signal}={}){
 const check=()=>{if(signal?.aborted)throw signal.reason??new DOMException('Operation cancelled.','AbortError');if(!valid())throw Error('The window or account changed.');};
 if(!files||typeof files.stat!=='function'||typeof files.readBounded!=='function')throw Error('Bounded file reading is unavailable.');
 if(!Number.isSafeInteger(maximumBytes)||maximumBytes<0||maximumBytes>128*1024*1024)throw Error('Invalid file size limit.');
 const metadata=value=>{
  if(!value||typeof value.version!=='string'||!value.version||!Number.isSafeInteger(value.bytes)||value.bytes<0)throw Error('File metadata is unavailable.');
  if(value.status==='conflict')throw Error('Resolve this file conflict in Files first.');
  if(value.bytes>maximumBytes)throw Error('This file exceeds the supported size.');
  return value;
 };
 check();const before=metadata(await files.stat(path));check();
 const file=await files.readBounded(path,maximumBytes,{signal});check();
 if(!file||!ArrayBuffer.isView(file.data)||Object.prototype.toString.call(file.data)!=='[object Uint8Array]')throw Error('Invalid file snapshot.');
 if(file.status==='conflict')throw Error('Resolve this file conflict in Files first.');
 if(file.data.byteLength>maximumBytes)throw Error('This file exceeds the supported size.');
 if(file.version!==before.version||file.data.byteLength!==before.bytes||
    (typeof before.sha256==='string'&&file.sha256!==before.sha256))throw Error('The file changed while opening. Try again.');
 const after=metadata(await files.stat(path));check();
 if(after.version!==file.version||after.bytes!==file.data.byteLength||
    (typeof file.sha256==='string'&&after.sha256!==file.sha256))throw Error('The file changed while opening. Try again.');
 return file;
}
