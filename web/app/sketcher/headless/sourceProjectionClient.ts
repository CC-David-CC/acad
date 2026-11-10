import {runSketchSolve,SketchSolveOptions} from './client';
import {captureProjectionPreparation,captureProjectionPreparationReply,sameProjectionPreparation,captureProjectionInspection,captureProjectionInspectionReply} from './sourceProjectionEnvelope.mjs';
import {withAdmissionCause} from '../constr/admissionCause.mjs';
const aborted=Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get;
// Each call owns a fresh disposable Worker through the existing shared runner.
export async function runSourceProjectionPreparation(url:string,input:any,options:SketchSolveOptions={}){
 const original=captureProjectionPreparation(input),deadline=performance.now()+(options.timeoutMs??30000);
 const current=()=>{if(options.signal!==undefined&&aborted.call(options.signal)||options.valid&&options.valid()!==true)throw new DOMException('Source projection was superseded.','AbortError');};
 const run=async(task:string,payload:any)=>{current();const remaining=Math.floor(deadline-performance.now());if(remaining<1)throw Object.assign(Error('Projection preparation timed out.'),{code:'TIMEOUT'});const value=captureProjectionPreparationReply(await runSketchSolve(url,{task,...payload},{...options,timeoutMs:remaining}),original.revision);current();if(value.ok===false)throw withAdmissionCause(Object.assign(Error(value.error.message),{code:value.error.code}),value.error.cause);return value;};
 const first=await run('source-projection-prepare',original),second=await run('source-projection-verify',{...original,expected:first});
 if(!sameProjectionPreparation(first,second))throw Object.assign(Error('Independent original projection preparation differs.'),{code:'INVALID_RESPONSE'});return first;
}
export async function runSourceProjectionInspection(url:string,input:any,options:SketchSolveOptions={}){
 const request=captureProjectionInspection(input);
 return captureProjectionInspectionReply(await runSketchSolve(url,{task:'source-projection-inspect',...request},options),request.revision);
}
