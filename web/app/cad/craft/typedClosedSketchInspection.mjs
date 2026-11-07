import {prepareTypedDependentSketch} from '../../sketcher/headless/typedDependentSketch.mjs';

// Read-only dimension-aware preparation, not a numerical solve or a typed
// mutation adapter. Reuse the registered physical dependent length contract.
// Only the resulting named millimeter lengths enter the numerical Worker;
// length quantities are never added to the expression service's scalar table.
export function prepareTypedClosedSketchInspection(source,resolveLength){
 if(typeof source!=='string'||source.length>1048576||new TextEncoder().encode(source).byteLength>1048576)throw Error('Typed inspection supports a bounded authored length source.');
 let sketch;try{sketch=JSON.parse(source);}catch{throw Error('Typed inspection source is invalid.');}
 if(!Array.isArray(sketch?.dimensions)||sketch.dimensions.length||!Array.isArray(sketch?.labels)||sketch.labels.length||
    !Array.isArray(sketch?.stages)||sketch.stages.length<1||sketch.stages.length>32||sketch.stages.some(stage=>!Array.isArray(stage?.generators)||stage.generators.length))
  throw Error('Typed inspection does not support sketch generators, labels or separate dimension records.');
 return prepareTypedDependentSketch(sketch,resolveLength);
}
