import {runSketchSolve,SketchSolveOptions} from './client';
import {captureLengthMeasurementRequest} from './lengthMeasurementIntent.mjs';
// Capture exact bounded plain input before the common client queues/yields.
export function runLengthMeasurement(workerUrl:string,input:any,options:SketchSolveOptions={},verify=false){
 const captured=captureLengthMeasurementRequest(input,verify);
 return runSketchSolve(workerUrl,Object.freeze({task:verify?'sketch-length-measurement-verify':'sketch-length-measurement',...captured}),options);
}
