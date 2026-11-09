import {PROFILE_EXTENT_TYPE,captureOwnedProfileExtentFeature,profileExtentFields,profileExtentDimensions,profileExtentInterval} from 'engine/solid/ownedProfileExtentFeature.mjs';
import {requireProfileExtentBuild} from 'engine/mount/selectedProfileBuildSelection.mjs';
import {validateOffsetSources} from 'sketcher/headless/offsetSourceValidation';
import {prepareTypedDependentSketch} from 'sketcher/headless/typedDependentSketch.mjs';
import {captureAuthoredCounterboreIntent} from 'engine/solid/authoredCounterboreIntent.mjs';
import {captureAuthoredBlindHoleIntent} from 'engine/solid/authoredBlindHoleIntent.mjs';
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
  // Schema + earlier-source relation only; actual entry/floor authority is the
  // owned Native candidate during ordinary restore. Named lengths resolve through
  // the existing physical evaluator below and actual feature materialization.
  // Bounded raw intent admission only; no placed frame/mesh is read from file.
  // Actual source/region/current Native construction remains candidate-owned.
  for(const operation of project.model.history)if(operation.type===PROFILE_EXTENT_TYPE){const p=captureOwnedProfileExtentFeature(operation.params);requireProfileExtentBuild(p.engine,p.engineRevision);if(profileExtentFields(p).every(key=>typeof p[key]==='number'))profileExtentInterval(profileExtentDimensions(p));}
  const blindSources=new Map<number,any>();
  for(const operation of project.model.history){
    if(operation.type==='WORKER_CENTERED_COUNTERBORE_V1'){
      const p=captureAuthoredCounterboreIntent(operation.params),parent=blindSources.get(p.sourceFeatureId),q=parent?.params;
      if(parent?.type!=='WORKER_SELECTED_PROFILE_EXTRUDE_V2'||q.engine!==p.engine||q.engineRevision!==p.engineRevision||q.faceId!==p.sourceFaceId||q.regionId!==p.sourceRegionId)throw Object.assign(Error('Counterbore native intent requires its genuine earlier selected constructor.'),{code:'COUNTERBORE_UNSUPPORTED_TARGET'});
      if(typeof p.stepDepth==='number'&&typeof q.depth==='number'&&p.stepDepth>=q.depth)throw Object.assign(Error('Counterbore step depth must remain strictly less than current part thickness.'),{code:'COUNTERBORE_STEP_NOT_INTERIOR'});
    }
    if(operation.type==='WORKER_CENTERED_BLIND_HOLE_V1'){
      const p=captureAuthoredBlindHoleIntent(operation.params),parent=blindSources.get(p.sourceFeatureId),q=parent?.params;
      if(!['WORKER_SELECTED_PROFILE_EXTRUDE_V2',PROFILE_EXTENT_TYPE].includes(parent?.type)||q.engine!==p.engine||q.engineRevision!==p.engineRevision||q.faceId!==p.sourceFaceId||q.regionId!==p.sourceRegionId)throw Object.assign(Error('Blind native intent requires its genuine earlier selected constructor.'),{code:'BLIND_UNSUPPORTED_TARGET'});
      if(parent.type===PROFILE_EXTENT_TYPE&&typeof p.depth==='number'&&profileExtentFields(q).every(key=>typeof q[key]==='number')&&p.depth>=profileExtentInterval(profileExtentDimensions(q)).span)throw Object.assign(Error('Blind depth must remain strictly below the actual source-owned total span.'),{code:'BLIND_DEPTH_NOT_INTERIOR'});
      if(typeof p.depth==='number'&&typeof q.depth==='number'&&p.depth>=q.depth)throw Object.assign(Error('Blind depth must remain strictly less than current part thickness.'),{code:'BLIND_DEPTH_NOT_INTERIOR'});
    }
    blindSources.set(Number(operation.params.featureId),operation);
  }
  const physical=decodePhysicalSource(project.model.expressions);
  let physicalValues:Map<string,any>=null;
  if (physical) {
    const result=evaluatePhysicalSource(physical);
    physicalValues=new Map(result.values.map(row=>[row.name,row]));
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
    if(data.stages.some(s=>s.generators.some(g=>g.typeId==='Offset'))){const external=physicalValues?prepareTypedDependentSketch(data,name=>{const row=physicalValues.get(name);if(!row||row.dimension!=='length')throw Object.assign(Error('Offset requires a current typed length.'),{code:'OFFSET_DISTANCE'});return row.value;}):{};validateOffsetSources(data,external);}
  }
  validateProjectSourceFrames(project);
  return value;
}
