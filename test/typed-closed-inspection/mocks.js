export class MOpenFaceShell {}
export const sketchBoundaryFrame=face=>face.frame;
export const runClosedSketchInspection=(...args)=>globalThis.__typedInspection(...args);
export const runSketchTransition=()=>{throw Error('Typed inspection must never invoke mutation worker')};
export const verifySignedDistanceCandidate=()=>{throw Error('Typed inspection must never verify mutation')};
export const verifyLineRelationCandidate=()=>{throw Error('Typed inspection must never verify mutation')};
export default '/test-worker.js';
