import {runSketchSolve,SketchSolveOptions} from './client';
import {captureArcLengthMeasurementRequest} from './arcLengthMeasurementIntent.mjs';
// Capture exact bounded plain input before the common client queues/yields.
export function runArcLengthMeasurement(workerUrl:string,input:any,options:SketchSolveOptions={},verify=false){
 const captured=captureArcLengthMeasurementRequest(input,verify);
 return runSketchSolve(workerUrl,Object.freeze({task:verify?'sketch-arc-length-measurement-verify':'sketch-arc-length-measurement',...captured}),options);
}
