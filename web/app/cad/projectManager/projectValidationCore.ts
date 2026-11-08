import {validateMirrorSourceGeometry} from 'sketcher/headless/mirrorSourceValidation';
import {validateSplineDerivedGeometry} from 'sketcher/headless/splineDerivedValidation';
import {captureSourceFrameParameters} from 'engine/source/sourceFrameIntent.mjs';
import {validateProjectSourceFrames} from 'sketcher/headless/sourceFrameValidation';
import {decodeProjectEnvelope, validateProjectTree} from './projectEnvelope.mjs';
import {validateProjectSketch} from 'sketcher/io';
import {parseMathDefinitions} from 'gems/safeExpression.mjs';
import {decodePhysicalSource} from '../parameters/physicalSource.mjs';
import {evaluatePhysicalSource} from '../parameters/evaluatePhysicalSource.mjs';
import {claimAuthoredFeatureIdentity} from '../craft/authoredFeatureIdentity.mjs';

const MAX_BYTES = 128 * 1024 * 1024;
const MAX_SKETCHES = 10000;
const MAX_SKETCH_ENTRIES = 100000;

export function preflight(value, parameterState?: {source?: string, result?: any}) {
  validateProjectTree(value);
  const {project} = decodeProjectEnvelope(value);
  if (!Array.isArray(project.model.history) || project.model.history.length > 10000 ||
      typeof project.model.expressions !== 'string' || !Array.isArray(project.sketches) || project.sketches.length > MAX_SKETCHES) throw new Error('Project has an invalid structure');
  // Native documents bypass the live command allocator. Validate the complete
  // producer roster here in the existing validation Worker, before any replay.
  const featureIds=new Set<number>();
  for(const operation of project.model.history){claimAuthoredFeatureIdentity(operation,featureIds);if(operation.type==='SOURCE_FRAME_V1'){const p=captureSourceFrameParameters(operation.params);if(p.parent&&!featureIds.has(p.parent.featureId))throw Object.assign(Error('Source attachment requires an earlier producer.'),{code:'INVALID_FRAME_DEPENDENCY'});}}
  const physical=decodePhysicalSource(project.model.expressions);
  if (physical) {
    const result=evaluatePhysicalSource(physical);
    if (parameterState) {parameterState.source=project.model.expressions;parameterState.result=result;}
  }
  else if (parseMathDefinitions(project.model.expressions).errors.length) throw new Error('Project contains invalid expressions');
  let entries = 0;
  for (const sketch of project.sketches) {
    if (!sketch || typeof sketch !== 'object' || !sketch.data || typeof sketch.data !== 'object') throw new Error('Project contains an invalid sketch');
    const data=sketch.data;
    for (const list of [data.objects,data.dimensions,data.labels,data.stages]) {
      if (!Array.isArray(list)) throw new Error('Project contains an invalid sketch');
      entries += list.length;
    }
    for (const stage of data.stages) {
      if (!stage || !Array.isArray(stage.constraints) || !Array.isArray(stage.generators)) throw new Error('Invalid sketch stage');
      entries += stage.constraints.length + stage.generators.length;
    }
    if (entries > MAX_SKETCH_ENTRIES) throw new Error('Project contains too many sketch entries');
    // Includes ordinary entity-domain admission before source can be staged.
    // Constraint regeneration and derived profile/kernel results are separate.
    validateProjectSketch(data);
    // Worker-only native derived/provenance proof before Open adoption. Main
    // legacy preflight remains bounded structure/domain only.
    for(const object of data.objects)if(object.type==='BSpline')validateSplineDerivedGeometry(object.id,object.data);
    if (data.constants !== undefined && parseMathDefinitions(data.constants).errors.length) throw new Error('A sketch contains invalid constants');
    // Geometry-only native regeneration after the unchanged source preflight.
    // No authored constraint solve, source replacement, or binding conversion.
    validateMirrorSourceGeometry(data);
  }
  validateProjectSourceFrames(project);
  return value;
}
