import {validatePatternCaches,patternFailureCodes} from '../generators/patternSource.mjs';
import {validateOffsetCaches,offsetFailureCodes} from '../generators/offsetSource.mjs';
import {admissionCause,causeForSolveStatus,failureCause} from '../constr/admissionCause.mjs';
import {inspectStageGenerators} from './stageGeneratorPolicy.mjs';
import {validateProjectSketch} from '../io';
import {inspectLocalJacobian,inspectStageLocalJacobians} from './localJacobian.mjs';
import {validExternalParameterName} from 'gems/safeExpression.mjs';
import {HeadlessSketchWorkspace} from './workspace';
import {validateSplineDerivedGeometry} from './splineDerivedValidation';
import {captureSolvedAuxiliaryWitnesses} from './capturedParameterOwnership';
import type {CapturedAuxiliaryWitnessBatch} from './capturedParameterOwnership';
import {getSolveTermination} from '../constr/solverTermination.mjs';

import {SketchSolveError,fail,record,only,inspectTree,typeIndex,assertSemantics,assertFixedBoundary,incomingIntent,validateConstraintGeometry} from './sketchValidation';

export {assertFixedBoundary} from './sketchValidation';

const MAX_COORD = 1e9;
function authoredEvidenceSnapshot(row) {
  // c.write() borrows its constants from the solver/input. A hook must never
  // receive that authority after residual checks. Rows are bounded JSON data
  // under the existing schema/tree policies; clone before recursively freezing.
  const snapshot=structuredClone(row);
  const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
  return freeze(snapshot);
}
export function solveSketch(request, onAuthoredEvidence?: (row: any) => void, onAuxiliaryWitness?: (batch:CapturedAuxiliaryWitnessBatch)=>void, onNumericalStop?: (observation:any)=>void) {
  try {
    if (!record(request) || typeof request.revision !== 'string' || !request.revision || request.revision.length > 256 || !record(request.sketch) || !record(request.externalParameters)) fail('INVALID','Invalid solve request.');
    inspectTree(request);
    const external=Object.create(null), keys=Object.keys(request.externalParameters);
    if(keys.length>1024)fail('LIMIT','Too many external parameters.');
    for(const key of keys){const value=request.externalParameters[key];if(!validExternalParameterName(key)||typeof value!=='number'||!Number.isFinite(value)||Math.abs(value)>MAX_COORD)fail('INVALID','Invalid external parameter.');external[key]=value;}
    const diagnostic=request.localJacobian,perStage=diagnostic?.scope==='per-stage';
    if(diagnostic!==undefined && (!record(diagnostic)||diagnostic.version!==1||Reflect.ownKeys(diagnostic).length!==(perStage?2:1)||perStage&&!Object.prototype.hasOwnProperty.call(diagnostic,'scope'))) fail('INVALID','Invalid local Jacobian request.');
    const sketch=request.sketch, oldBoundary=sketch.boundary;
    validateOffsetCaches(sketch,name=>external[name]);
    validatePatternCaches(sketch);
    if (!only(sketch,['version','objects','dimensions','labels','stages','constants','metadata','boundary'])) fail('UNSUPPORTED','Unsupported sketch fields.');
    if (!oldBoundary) fail('INVALID','Saved sketch boundary is required.');
    // Bound spline constructors before independently rebuilding their
    // derived geometry, and never replace authored source coordinates.
    typeIndex(sketch,oldBoundary);for(const object of sketch.objects)if(object.type==='BSpline')try{validateSplineDerivedGeometry(object.id,object.data)}catch(error){fail(error?.code==='SPLINE_RESOURCE_LIMIT'?'LIMIT':error?.code==='UNSUPPORTED_SPLINE_SOURCE'?'UNSUPPORTED':'SPLINE_GEOMETRY',typeof error?.message==='string'?error.message:'B-spline derived geometry is invalid or stale.',failureCause(error)||(error?.code==='UNSUPPORTED_SPLINE_SOURCE'?undefined:admissionCause(error?.code==='SPLINE_RESOURCE_LIMIT'?'resource-limit':error?.code==='SPLINE_DERIVED_MISMATCH'?'retained-validation-failure':error?.code==='NONFINITE_RESULT'?'nonfinite-result':'invalid-domain')));}
    // Both the old and current boundary are verified before loading. The
    // structured-cloned worker request is never shared with the caller.
    assertSemantics(sketch,oldBoundary,request.boundary);
    validateProjectSketch(sketch);
    const candidate={...sketch,boundary:request.boundary};
    validateProjectSketch(candidate);
    const workspace=new HeadlessSketchWorkspace(external);
    workspace.io._loadSketch(candidate,{strict:true});
    const evidence=[], completed=[];
    for(const stage of workspace.parametricManager.stages){
      const sys=stage.solverSystem;sys.prepare();stage.solve(false);
      // Internal bounded observation of this actual final solve, never saved or
      // added to public success replies, and never admission/accuracy authority.
      const termination=getSolveTermination(sys.solveStatus);
      if(onNumericalStop&&termination)onNumericalStop(Object.freeze({stage:stage.index,termination}));
      for(const prior of completed) for(const [parameter,value] of prior) if(!Object.is(parameter.get(),value)) fail('STAGE_CHANGED','A later stage changed earlier geometry.');
      const snapshot=new Map(); for(const object of stage.objects) object.visitParams(p=>{if(!Number.isFinite(p.get())) fail('INVALID','Non-finite stage geometry.'); snapshot.set(p,p.get());}); completed.push(snapshot);
      if(!sys.solveStatus.success || !Number.isFinite(sys.solveStatus.error))fail('SOLVE_FAILED','Sketch solver did not establish a finite solution.',causeForSolveStatus(sys.solveStatus));
    }
    for(const [stageIndex,stage] of workspace.parametricManager.stages.entries()){
      const sys=stage.solverSystem;let authoredIndex=0;
      if(!sys.solveStatus.success || !Number.isFinite(sys.solveStatus.error))fail('SOLVE_FAILED','Sketch solver did not establish a finite solution.',causeForSolveStatus(sys.solveStatus));
      for(const c of sys.allConstraints){
        if (sys.conflicting.has(c) && !sys.redundant.has(c)) fail('SOLVE_FAILED','A constraint was rejected during solving.',sys.getAdmissionCause(c));
        const profile=validateConstraintGeometry(c);
        if(!c.internal){
          const state=sys.redundant.has(c)?'redundant':sys.conflicting.has(c)?'rejected':'accepted';
          evidence.push({typeId:c.schema.id,state,...profile});
          if(onAuthoredEvidence){const written=c.write();onAuthoredEvidence(authoredEvidenceSnapshot({stage:stageIndex,index:authoredIndex,typeId:c.schema.id,objects:written.objects,constants:written.constants||{},admission:state}));}
          authoredIndex++;
        }
      }
    }
    assertFixedBoundary(workspace.createIndex(),request.boundary);
    const solved=JSON.parse(workspace.io.serializeSketch(sketch.metadata,{strict:true}));solved.boundary=request.boundary;
    // Geometry can become degenerate during the solve even when the input
    // was valid. Recheck output domains before returning anything to a caller.
    typeIndex(solved,request.boundary);
    for(const object of solved.objects)if(object.type==='BSpline')try{validateSplineDerivedGeometry(object.id,object.data)}catch(error){fail(error?.code==='SPLINE_RESOURCE_LIMIT'?'LIMIT':error?.code==='UNSUPPORTED_SPLINE_SOURCE'?'UNSUPPORTED':'SPLINE_GEOMETRY',typeof error?.message==='string'?error.message:'Solved B-spline derived geometry is invalid or stale.',failureCause(error)||(error?.code==='UNSUPPORTED_SPLINE_SOURCE'?undefined:admissionCause(error?.code==='SPLINE_RESOURCE_LIMIT'?'resource-limit':error?.code==='SPLINE_DERIVED_MISMATCH'?'retained-validation-failure':error?.code==='NONFINITE_RESULT'?'nonfinite-result':'invalid-domain')));}
    validateOffsetCaches(solved,name=>external[name]);
    validatePatternCaches(solved);
    try { inspectStageGenerators(solved); } catch { fail('GENERATOR_CHANGED','Generated geometry is inconsistent.'); }
    if(JSON.stringify(solved.stages.map(s=>s.generators))!==JSON.stringify(sketch.stages.map(s=>s.generators)))fail('INTENT_CHANGED','Generator intent changed during solving.');
    if(JSON.stringify(incomingIntent(solved))!==JSON.stringify(incomingIntent(sketch)))fail('INTENT_CHANGED','Constraint intent changed during solving.');
    if(JSON.stringify(solved.objects.map(o=>[o.id,o.type,o.role,o.stage]))!==JSON.stringify(sketch.objects.map(o=>[o.id,o.type,o.role,o.stage])))fail('INTENT_CHANGED','Sketch object identity changed during solving.');
    if(JSON.stringify([solved.dimensions,solved.labels,solved.constants,solved.metadata])!==JSON.stringify([sketch.dimensions,sketch.labels,sketch.constants,sketch.metadata]))fail('INTENT_CHANGED','Sketch non-geometric state changed during solving.');
    inspectTree(solved);
    const localJacobian=diagnostic===undefined?undefined:perStage?inspectStageLocalJacobians(workspace.parametricManager.stages,workspace.parametricManager.groundStage):inspectLocalJacobian(workspace.parametricManager.stages);
    // Internal-only actual solved observation. Never add this to the public
    // request/reply, saved sketch, diagnostics, or caller-provided flags.
    if(onAuxiliaryWitness)onAuxiliaryWitness(captureSolvedAuxiliaryWitnesses(workspace));
    return {revision:request.revision,ok:true as const,sketch:solved,evidence,...(localJacobian?{localJacobian}:{})};
  } catch(error) {
    return {revision:typeof request?.revision==='string'?request.revision:'',ok:false as const,error:{code:error instanceof SketchSolveError?error.code:(offsetFailureCodes.includes(error?.code)||patternFailureCodes.includes(error?.code))?error.code:'SOLVE_ERROR',message:error instanceof Error?error.message:'Sketch solve failed.',...(failureCause(error)?{cause:failureCause(error)}:{})}};
  }
}
