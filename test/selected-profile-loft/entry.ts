export {inspectSolvedLoftSources,prepareSolvedLoft} from '../../modules/engine/extrusion/selectedSketchLoft.mjs';
export {captureOwnedLoftFeature,captureOwnedLoftEvaluation,captureLoftSectionReferences,captureLoftSeam} from '../../modules/engine/solid/ownedLoftFeature.mjs';
export {projectRenderSketch} from '../../web/app/sketcher/headless/renderSketchProjection.mjs';
import {Generator} from '../../web/app/sketcher/id-generator';
export {sketchMutationEpoch} from '../../web/app/sketcher/sketchMutationEpoch.mjs';
export function forbidShapeAllocation(){const original=Generator.genID;Generator.genID=()=>{throw Error('Semantic source preparation must not instantiate a native SketchObject/Param');};return()=>{Generator.genID=original;};}
