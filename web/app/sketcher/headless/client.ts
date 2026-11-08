import {captureConstraintGroupEnvelope} from './constraintGroupEnvelope.mjs';
import {captureSourcePlaneReply} from './sourcePlaneDepthEnvelope.mjs';
import {captureSignedDistanceEnvelope,captureSignedDistanceVerificationEnvelope} from './signedDistanceEnvelope.mjs';
import {capturePointDistanceEnvelope} from './pointDistanceEnvelope.mjs';
import {captureLineRelationEnvelope} from './lineRelationEnvelope.mjs';
import {captureLegacyExpressionResponse} from 'cad/parameters/legacyNumericExpressions.mjs';
import {captureWorkerReplyRecord} from 'engine/mount/workerReplyRecord.mjs';
import {captureSketchFailure} from '../constr/admissionCause.mjs';
import {captureDrivingDimensionReply} from './drivingDimensionTarget.mjs';
export interface SketchSolveOptions {
  signal?: AbortSignal;
  valid?: () => boolean;
  timeoutMs?: number;
}

// This lock coordinates cooperating sketch clients on the same origin. It is
// deliberately separate from all Files and storage locks. A module instance
// permits at most two outstanding requests, including pre-dispatch checks.
const SKETCH_LOCK = 'codi-sketch-solve-v1';
const MAX_OUTSTANDING_PER_DOCUMENT = 2;
let outstanding = 0;
// A failed termination cannot prove physical Worker release. Fence this module instance.
let failedCleanup:any=null;

function validDXFEnvelope(result:any):boolean {
  try {const size=Object.getOwnPropertyDescriptor(Blob.prototype,'size').get.call(result?.blob),type=Object.getOwnPropertyDescriptor(Blob.prototype,'type').get.call(result?.blob);
    return Object.keys(result).sort().join(',')==='blob,coordinates,frame,ok,revision,unit'&&result.unit==='millimeter'&&result.coordinates==='sketch-local'&&result.frame&&typeof result.frame==='object'&&Number.isSafeInteger(size)&&size>0&&size<=8*1024*1024&&type==='application/dxf';
  } catch {return false;}
}

export async function runSketchSolve(workerUrl: string, request: any, options: SketchSolveOptions = {}): Promise<any> {
  const cancelled = () => new DOMException('Sketch solve cancelled', 'AbortError');
  const valid = () => !options.signal?.aborted && (!options.valid || options.valid());
  if (typeof options.valid !== 'undefined' && typeof options.valid !== 'function') throw new Error('Invalid solve guard.');
  if (options.signal && (typeof options.signal.addEventListener !== 'function' || typeof options.signal.removeEventListener !== 'function')) throw new Error('Invalid abort signal.');
  try { if (!valid()) throw cancelled(); } catch (_) { throw cancelled(); }
  if (!request || typeof request.revision !== 'string' || !request.revision || request.revision.length > 256) throw new Error('Invalid solve revision.');
  const timeout = options.timeoutMs === undefined ? 30000 : options.timeoutMs;
  if (!Number.isSafeInteger(timeout) || timeout < 1 || timeout > 30000) throw new Error('Invalid solve timeout.');
  const deadlineAt = performance.now() + timeout;
  let url;
  try { url = new URL(workerUrl, window.location.href); } catch (_) { throw new Error('Invalid worker URL.'); }
  if (url.origin !== window.location.origin || !['http:','https:'].includes(url.protocol)) throw new Error('Sketch worker must be same-origin.');
  if (!navigator.locks || typeof navigator.locks.request !== 'function') throw new Error('Sketch solving requires browser Web Locks.');
  if(failedCleanup)throw failedCleanup;
  if (outstanding >= MAX_OUTSTANDING_PER_DOCUMENT) throw new Error('Too many pending sketch solves in this window.');
  outstanding++;
  try {
    // Limit structured-clone cost before dispatch. Yield between small batches
    // so even validation of an oversized request does not monopolize the UI.
    const todo = [[request, 0]], seen = new Set(); let count = 0, characters = 0;
    while (todo.length) {
      const [value, depth] = todo.pop();
      if (++count > 100000 || depth > 64) throw new Error('Sketch solve request exceeds limits.');
      if (typeof value === 'string' && (characters += value.length) > 4 * 1024 * 1024) throw new Error('Sketch solve request exceeds limits.');
      if (value && typeof value === 'object') {
        if (seen.has(value)) throw new Error('Sketch solve request must be a tree.');
        seen.add(value);
        if (Array.isArray(value) && value.length > 10000) throw new Error('Sketch solve request exceeds limits.');
        const entries=Object.entries(value);
        if (entries.length + todo.length + count > 100000) throw new Error('Sketch solve request exceeds limits.');
        for (const [key,child] of entries) {
          if ((characters += key.length) > 4 * 1024 * 1024) throw new Error('Sketch solve request exceeds limits.');
          todo.push([child, depth + 1]);
        }
      }
      if (count % 512 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
        try { if (!valid()) throw cancelled(); } catch (_) { throw cancelled(); }
        if (performance.now() >= deadlineAt) throw new Error('Sketch solve timed out.');
      }
    }
    try { if (!valid()) throw cancelled(); } catch (_) { throw cancelled(); }
    const remaining = deadlineAt - performance.now();
    if (remaining <= 0) throw new Error('Sketch solve timed out.');

    // Keep the origin-wide lock for the entire lifetime of the dedicated
    // worker. Aborting a queued request does not affect the lock holder.
    let cleanupFailure:any=null,operationFailure:any=null;
    const cleanup=(action:()=>void,operationError:any)=>{try{action()}catch(cause){if(!cleanupFailure)cleanupFailure=Object.assign(new Error('Sketch Worker cleanup failed; reload this client module before evaluating again.'),{code:'WORKER_CLEANUP_FAILED',cause,operationError:operationError||null});if(!failedCleanup)failedCleanup=cleanupFailure;}};
    const aborter = new AbortController();
    let stopReason: Error = null;
    const stop = (reason: Error) => { if (!stopReason) { stopReason=reason; aborter.abort(); } };
    const onAbort = () => stop(cancelled());
    const deadline = setTimeout(() => stop(new Error('Sketch solve timed out.')), remaining);
    const poll = setInterval(() => { try { if (!valid()) onAbort(); } catch (_) { onAbort(); } }, 100);
    try {
      options.signal?.addEventListener('abort',onAbort,{once:true});
      if (!valid()) onAbort();
      return await navigator.locks.request(SKETCH_LOCK,{mode:'exclusive',signal:aborter.signal},async () => {
        if(failedCleanup)throw failedCleanup;
        if (stopReason) throw stopReason;
        try { if (!valid()) throw cancelled(); } catch (_) { throw cancelled(); }
        if (performance.now() >= deadlineAt) throw new Error('Sketch solve timed out.');
        return await new Promise((resolve,reject) => {
          let worker: Worker;
          try { worker = new Worker(url.href); } catch (_) { reject(new Error('Sketch worker could not start.')); return; }
          let done=false;
          const finish=(error, value?)=>{if(done)return;done=true;
            cleanup(()=>aborter.signal.removeEventListener('abort',workerAbort),error);
            cleanup(()=>{worker.onmessage=null;worker.onerror=null;worker.onmessageerror=null;},error);
            cleanup(()=>worker.terminate(),error);
            if(cleanupFailure)reject(cleanupFailure);else if(error)reject(error);else resolve(value);
          };
          const workerAbort=()=>finish(stopReason || cancelled());
          aborter.signal.addEventListener('abort',workerAbort,{once:true});
          worker.onerror=()=>finish(new Error('Sketch worker failed.'));
          worker.onmessageerror=()=>finish(new Error('Sketch worker returned invalid data.'));
          worker.onmessage=event=>{
            try {
              if(stopReason || !valid())return finish(stopReason || cancelled());
              if(performance.now() >= deadlineAt) {
                stop(new Error('Sketch solve timed out.'));
                return finish(stopReason);
              }
              let result;try{result=captureWorkerReplyRecord(event.data);if(result.ok===false)result.error=captureSketchFailure(result.error);}catch{return finish(new Error('Invalid sketch Worker reply fields.'));}
              if(request.task==='sketch-source-plane-depth'||request.task==='sketch-source-plane-depth-verify'){try{return finish(null,captureSourcePlaneReply(result,request.revision));}catch(error){return finish(error);}}
              if(request.task==='sketch-transition-constraint-group'){try{return finish(null,captureConstraintGroupEnvelope(result,request.revision,request.intent));}catch{return finish(new Error('Invalid constraint group response.'));}}
              if(request.task==='sketch-transition-verify-constraint-group'){try{return finish(null,captureSignedDistanceVerificationEnvelope(result,request.revision));}catch{return finish(new Error('Invalid constraint group verification.'));}}
              if(request.task==='sketch-transition-driving-dimension'){try{return finish(null,captureDrivingDimensionReply(result,request.revision));}catch{return finish(new Error('Invalid driving dimension response.'));}}
              if(request.task==='sketch-transition-verify-driving-dimension'||request.task==='sketch-transition-verify-dimension-travel'){try{return finish(null,captureSignedDistanceVerificationEnvelope(result,request.revision));}catch{return finish(new Error('Invalid driving dimension verification response.'));}}
              if(request.task==='sketch-transition-verify-remove-primitive'||request.task==='sketch-transition-verify-primitive'){try{return finish(null,captureSignedDistanceVerificationEnvelope(result,request.revision));}catch{return finish(new Error('Invalid primitive verification response.'));}}
              if(request.task==='sketch-transition-verify-point-coordinates'){try{return finish(null,captureSignedDistanceVerificationEnvelope(result,request.revision));}catch{return finish(new Error('Invalid coordinate batch verification response.'));}}
              if(request.task==='sketch-transition-verify-line-relation'||request.task==='sketch-transition-verify-length-relation'){try{return finish(null,captureSignedDistanceVerificationEnvelope(result,request.revision));}catch{return finish(new Error('Invalid line relation verification response.'));}}
              if(request.task==='sketch-transition-line-relation'){try{return finish(null,captureLineRelationEnvelope(result,request.revision));}catch{return finish(new Error('Invalid line relation worker response.'));}}
              if(request.task==='sketch-transition-verify-signed-distance'){try{return finish(null,captureSignedDistanceVerificationEnvelope(result,request.revision));}catch{return finish(new Error('Invalid signed distance verification response.'));}}
              if(request.task==='sketch-transition-verify-point-distance'){try{return finish(null,captureSignedDistanceVerificationEnvelope(result,request.revision));}catch{return finish(new Error('Invalid Euclidean point distance verification response.'));}}
              if(request.task==='sketch-transition-point-distance'){try{return finish(null,capturePointDistanceEnvelope(result,request.revision));}catch{return finish(new Error('Invalid Euclidean point distance response.'));}}
              if(request.task==='sketch-transition-signed-distance'){try{return finish(null,captureSignedDistanceEnvelope(result,request.revision));}catch{return finish(new Error('Invalid signed distance worker response.'));}}
              if(request.task==='legacy-expression-transaction'){try{return finish(null,captureLegacyExpressionResponse(result,request.revision,request.sketchJSON===null));}catch{return finish(new Error('Invalid legacy expression worker response.'));}}
              const special=request.task==='sketch-transition-remove-primitive' ? typeof result?.serializedSketch==='string'&&result.serializedSketch.length<=1048576&&Array.isArray(result.evidence)&&result.evidence.length<=10000&&result?.removed&&typeof result.removed==='object' : request.task==='sketch-transition-point-coordinates' ? typeof result?.serializedSketch==='string'&&result.serializedSketch.length<=1048576&&Array.isArray(result.evidence)&&result.evidence.length<=10000&&Array.isArray(result.points)&&result.points.length>=1&&result.points.length<=32 : request.task==='sketch-export-dxf' ? validDXFEnvelope(result) : request.task==='sketch-transition-point-coordinate' ? typeof result?.serializedSketch==='string'&&result.serializedSketch.length<=1048576&&Array.isArray(result.evidence)&&result.evidence.length<=10000&&result?.point&&typeof result.point==='object' : request.task==='sketch-transition-diameter' ? typeof result?.serializedSketch==='string'&&result.serializedSketch.length<=1048576&&Array.isArray(result.evidence)&&result.evidence.length<=10000&&result?.dimension&&typeof result.dimension==='object' : request.task==='sketch-transition-projection' ? typeof result?.serializedSketch==='string'&&result.serializedSketch.length<=1048576&&result?.witness&&typeof result.witness==='object' : request.task==='sketch-transition-concentric' ? typeof result?.serializedSketch==='string'&&result.serializedSketch.length<=1048576&&Array.isArray(result.evidence)&&result.evidence.length<=10000&&result?.relation&&typeof result.relation==='object' : request.task==='sketch-transition-inspection' ? Array.isArray(result?.objects)&&result.objects.length<=10000&&Array.isArray(result?.constraints)&&result.constraints.length<=10000 : (request.task==='sketch-transition-replay'||request.task==='sketch-transition-length-relation'||request.task==='sketch-transition-primitive') ? typeof result?.serializedSketch==='string'&&result.serializedSketch.length<=1048576&&Array.isArray(result.evidence)&&result.evidence.length<=10000 : (request.task==='typed-sketch-transaction'||request.task==='sketch-transition-empty') ? typeof result?.serializedSketch==='string'&&result.serializedSketch.length<=1048576 : request.task==='sketch-save-validation' ? result?.validated===true : (request.task===undefined||['rectangle','rectangle-extrusion-solve','typed-selected-profile-solve','typed-rectangle-bind','typed-dependent-solve','typed-dependent-diagnostics'].includes(request.task))&&!!result?.sketch&&typeof result.sketch==='object'&&Array.isArray(result.evidence);
              if(!result||result.revision!==request.revision||typeof result.ok!=='boolean'||
                 (result.ok && !special) ||
                 (!result.ok && (!result.error || typeof result.error.code !== 'string' || typeof result.error.message !== 'string')))return finish(new Error('Invalid sketch worker result.'));
              finish(null,result);
            } catch (_) { finish(cancelled()); }
          };
          try { if(stopReason || !valid())finish(stopReason || cancelled()); else worker.postMessage(request); } catch (_) { finish(new Error('Sketch solve request could not be sent.')); }
        });
      });
    } catch (error) { operationFailure=error;throw cleanupFailure || stopReason || error; }
    finally {
      clearTimeout(deadline);clearInterval(poll);cleanup(()=>options.signal?.removeEventListener('abort',onAbort),stopReason||operationFailure);
      if(cleanupFailure)throw cleanupFailure;
    }
  } finally { outstanding--; }
}
