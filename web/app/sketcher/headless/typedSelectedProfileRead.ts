import {solveSketch} from './solve';
import {assertVerifiedReplayGeometry} from './verifiedReplayGeometry';
import {evaluateCapturedSketch} from './capturedSketchEvaluation';
import {reconstructTypedRectangle} from './typedRectangleReconstruction';
// Read proof starts with the ORIGINAL captured source, never a candidate
// certified against itself. Original equations are evaluated without moving
// its coordinates after fresh actual cold admission and bounded replay proof.
export function solveTypedSelectedProfile(request:any){
 const canonical=reconstructTypedRectangle(request);if(canonical)return canonical;
 let auxiliary;const cold=solveSketch({...request,sketch:structuredClone(request.sketch)},undefined,batch=>{auxiliary=batch;});if(!cold.ok)return cold;
 assertVerifiedReplayGeometry(request.sketch,cold.sketch,cold.evidence,request.externalParameters);
 const captured=structuredClone(request.sketch);
 for(let si=0;si<captured.stages.length;si++)for(let ci=0;ci<captured.stages[si].constraints.length;ci++)captured.stages[si].constraints[ci].admission=structuredClone(cold.sketch.stages[si].constraints[ci].admission);
 const checked=evaluateCapturedSketch(captured,request.externalParameters,cold.evidence,undefined,auxiliary);
 return {revision:request.revision,ok:true as const,sketch:captured,evidence:checked.evidence,serializedSketch:JSON.stringify(captured)};
}
