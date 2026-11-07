export class MOpenFaceShell {}
export const sketchBoundaryFrame=face=>face.frame;
export const runClosedSketchInspection=(...args)=>globalThis.__closedInspection(...args);
export const runSketchTransition=(...args)=>globalThis.__closedTransition(...args);
export default '/test-worker.js';
