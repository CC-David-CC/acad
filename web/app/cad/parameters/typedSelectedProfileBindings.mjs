import {prepareTypedDependentSketch} from '../../sketcher/headless/typedDependentSketch.mjs';
import {QuantityError} from './physicalQuantities.mjs';
// Worker-only source preparation. This proves named-field dimensional admission,
// not a solved sketch, selected boundary or Native result. No source is filtered.
export function prepareTypedSelectedProfileSource(source,resolveLength){
 if(typeof source!=='string'||source.length>65536||new TextEncoder().encode(source).byteLength>65536||typeof resolveLength!=='function')throw new QuantityError('INVALID_INPUT','Expected a bounded selected source.');
 let sketch;try{sketch=JSON.parse(source)}catch{throw new QuantityError('INVALID_INPUT','Invalid selected source JSON.');}
 if(sketch?.version!==3||!Array.isArray(sketch.objects)||sketch.objects.length>4096||!Array.isArray(sketch.stages)||sketch.stages.length!==1||!Array.isArray(sketch.stages[0]?.constraints)||!Array.isArray(sketch.stages[0]?.generators)||sketch.stages[0].generators.length)throw new QuantityError('UNSUPPORTED_TARGET','One bounded generator-free selected source stage is required.');
 // The actual decoder/solver and semantic provider perform geometry, identity,
 // domain, region and whole-source census checks before any publication.
 const externalParameters=prepareTypedDependentSketch(sketch,resolveLength);
 return {sketch,externalParameters};
}
