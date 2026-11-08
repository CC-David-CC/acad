import {runSketchSolve,SketchSolveOptions} from './client';
import {captureSourceFrameReply} from './sourceFrameEnvelope.mjs';
export async function runSourceFramePreparation(url:string,request:any,options:SketchSolveOptions={}){
 const deadline=performance.now()+(options.timeoutMs??30000),run=async(input:any)=>{if(options.signal?.aborted||options.valid&&options.valid()!==true)throw new DOMException('Source frame was superseded.','AbortError');const remaining=Math.floor(deadline-performance.now());if(remaining<1)throw Object.assign(Error('Source frame timed out.'),{code:'TIMEOUT'});const r:any=captureSourceFrameReply(await runSketchSolve(url,{task:'source-frame-transition',...input},{...options,timeoutMs:remaining}),request.revision);if(!r.ok)throw Object.assign(Error(r.error.message),r.error);return r;};
 const first=await run(request),second=await run({...request,...(request.mode==='reframe'?{candidateJSON:first.serializedSketch}:{})});
 if(JSON.stringify(first)!==JSON.stringify(second))throw Object.assign(Error('Independent source frame reconstruction differs.'),{code:'INVALID_RESPONSE'});return first;
}
