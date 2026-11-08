import {solveSketch} from './solve';
import {assertVerifiedReplayGeometry} from './verifiedReplayGeometry';
import {evaluateCapturedSketch} from './capturedSketchEvaluation';
import {captureSketchFailure,failureCause} from '../constr/admissionCause.mjs';
import type {CapturedAuxiliaryWitnessBatch} from './capturedParameterOwnership';

// Read the complete captured source at its actual coordinates. A successful
// independent cold optimizer supplies admission/auxiliary evidence, never the
// geometry returned to downstream profile/axis/path/Native consumers.
export function readCapturedProfile(request:any){
 const revision=request.revision;
 try{
  let auxiliary:CapturedAuxiliaryWitnessBatch|undefined;
  // Preserve the old/current boundary pair for solveSketch's existing source
  // reference checks. Neither role aliases the input or the returned capture.
  const cold=solveSketch({...request,sketch:structuredClone(request.sketch),boundary:structuredClone(request.boundary)},undefined,batch=>{auxiliary=batch;});
  if(!cold.ok)return cold;
  const captured=structuredClone(request.sketch);
  // Current boundary is an explicit authenticated task input, as in the prior
  // DTO contract. It is admitted against saved referenced boundaries above;
  // no coordinate, source frame or optimizer boundary is used as a substitute.
  captured.boundary=structuredClone(request.boundary);
  assertVerifiedReplayGeometry(captured,cold.sketch,cold.evidence,request.externalParameters);
  for(let si=0;si<captured.stages.length;si++)for(let ci=0;ci<captured.stages[si].constraints.length;ci++){
   captured.stages[si].constraints[ci].admission=structuredClone(cold.sketch.stages[si].constraints[ci].admission);
  }
  const checked=evaluateCapturedSketch(captured,request.externalParameters,cold.evidence,undefined,auxiliary);
  return{revision,ok:true as const,sketch:captured,evidence:checked.evidence,serializedSketch:JSON.stringify(captured)};
 }catch(error){
  const cause=failureCause(error);
  return{revision,ok:false as const,error:captureSketchFailure({code:typeof error?.code==='string'?error.code:'CAPTURED_PROFILE_READ_FAILED',message:typeof error?.message==='string'?error.message:'Captured profile source could not be validated.',...(cause?{cause}:{})})};
 }
}
