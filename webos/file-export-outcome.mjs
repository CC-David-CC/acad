// Shared export settlement. Exceptions may be any JavaScript value; diagnostics
// read bounded data descriptors only. Browser commit never implies server sync.
export function fileErrorData(value,key){try{if(value===null||(typeof value!=='object'&&typeof value!=='function'))return;for(let i=0;value&&i<8;i++,value=Object.getPrototypeOf(value)){const d=Object.getOwnPropertyDescriptor(value,key);if(d)return Object.hasOwn(d,'value')?d.value:undefined}}catch{return}}
function ownData(value,key){try{const d=Object.getOwnPropertyDescriptor(value,key);return d&&Object.hasOwn(d,'value')?d.value:undefined}catch{return}}
export function safeFileErrorMessage(error,fallback='Export was interrupted. Inspect My files before retrying.'){const value=fileErrorData(error,'message'),bounded=typeof value==='string'?value.slice(0,1024):'';return bounded.trim()?bounded:fallback}
export function fileOutcomeError(error,outcome,current,label='STEP'){
 const known=outcome?.kind==='committed',pending=outcome?.kind==='pending';if(!known&&!pending)return error;
 const message=fileErrorData(error,'message'),name=fileErrorData(error,'name'),code=fileErrorData(error,'code'),detail=typeof message==='string'?message.slice(0,512):'Completion was interrupted.';
 const result=new Error(!current?'The export outcome belongs to a window or account that changed. Inspect My files before retrying.':(known?'The '+label+' file was saved on this device, but completion was interrupted. ':'The export write outcome is uncertain. ')+'Inspect My files before retrying. '+detail,{cause:error});result.name=typeof name==='string'&&name.length<=128?name:'Error';if(typeof code==='string')result.code=code.slice(0,256);
 if(known||ownData(error,'committed')===true)result.committed=true;else result.possiblyCommitted=true;return result;
}
export async function settleCadFileExport(token,{command,tell,label,isCurrent=()=>true},run){
 let outcome=null,result,failure=null;const ownerCurrent=()=>{try{return isCurrent()===true}catch{return false}};
 const write=Object.freeze({begin(){if(outcome!==null)throw Error('The export write was already started.');outcome={kind:'pending'}},accept(value){if(outcome?.kind!=='pending')throw Error('No export write is pending.');const version=Object.getOwnPropertyDescriptor(value??{},'version'),status=Object.getOwnPropertyDescriptor(value??{},'status');for(const field of[version,status])if(!field?.enumerable||!Object.hasOwn(field,'value')||typeof field.value!=='string'||!field.value||field.value.length>256)throw Error('The browser file-write receipt is unavailable. Inspect My files before retrying.');outcome={kind:'committed'};return Object.freeze({version:version.value,status:status.value})}});
 try{result=await run(write);if(outcome!==null&&!result)throw Error('The export result is unavailable. Inspect My files before retrying.');if(outcome?.kind==='committed')result=Object.freeze({...result,committed:true})}catch(cause){failure={cause}}
 try{token.finish()}catch(cause){if(failure===null)failure={cause}}
 if(failure===null&&!ownerCurrent())failure={cause:new DOMException('The modeling window or account changed.','AbortError')};
 if(failure!==null){const error=fileOutcomeError(failure.cause,outcome,ownerCurrent(),label);try{tell('Could not export '+label+': '+safeFileErrorMessage(error))}catch{}if(command)throw error;return Object.freeze({status:'interrupted',...(outcome?.kind==='committed'?{committed:true}:outcome?.kind==='pending'?{possiblyCommitted:true}:{})})}
 return result;
}
