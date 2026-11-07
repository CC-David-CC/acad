import {solveSketch} from './solve';
import {sameRestoredSketch} from '../historyEquivalence.mjs';
import {buildProjectionWitness} from './projectionWitness.mjs';

// Private task entry: invoke in a disposable Worker with the pinned solver.
// No public field can assert that input is validated or skip a solve.
export function prepareAcceptedSketchProjection(request:any) {
  let revision='';
  try {
    const d=request&&typeof request==='object'?Object.getOwnPropertyDescriptor(request,'revision'):null;
    if(d?.enumerable&&Object.prototype.hasOwnProperty.call(d,'value')&&typeof d.value==='string'&&d.value.length<=256)revision=d.value;
    if(!request||typeof request!=='object'||Array.isArray(request)||Reflect.ownKeys(request).sort().join(',')!=='externalParameters,frame,revision,sketchJSON'||!revision||typeof request.sketchJSON!=='string'||request.sketchJSON.length>1048576||new TextEncoder().encode(request.sketchJSON).byteLength>1048576)throw Error('Invalid projection request.');
    const sketch=JSON.parse(request.sketchJSON);if(!sketch?.boundary)throw Error('A complete sketch is required.');
    const rows:any[]=[],solved=solveSketch({revision,sketch,boundary:structuredClone(sketch.boundary),externalParameters:request.externalParameters},row=>rows.push(row));
    if(!solved.ok)return solved;
    const serializedSketch=JSON.stringify(solved.sketch);
    if(serializedSketch.length>1048576||new TextEncoder().encode(serializedSketch).byteLength>1048576||!sameRestoredSketch(request.sketchJSON,serializedSketch))throw Error('The current sketch geometry changed.');
    const witness=buildProjectionWitness(serializedSketch,rows,request.frame);
    return {revision,source:request.sketchJSON,ok:true as const,serializedSketch,witness};
  } catch(error) {return {revision,ok:false as const,error:{code:'PROJECTION_INVALID',message:typeof error?.message==='string'?error.message:'Sketch projection failed.'}};}
}
