import {HeadlessSketchWorkspace} from './workspace';
import {ConstraintDefinitions} from '../constr/ANConstraints';
import {inspectPointLineDistance} from '../actions/pointLineDistanceAdmission';
import {pointLineConstantsValid,pointLineSide} from '../constr/pointLineDistanceDomain.mjs';
import {validateConstraintGeometry} from './sketchValidation';
import {dimensionLocator} from './drivingDimensionTarget.mjs';
// Invoked only in disposable Workers, from an independently verified source.
export function inspectPointLineSupports(sketch:any,bindings:any){
 const out=new Map<string,any>();if(!sketch.stages.some(s=>s.constraints.some(c=>c.typeId==='DistancePL')))return out;
 const workspace=new HeadlessSketchWorkspace(bindings);workspace.io._loadSketch(structuredClone(sketch),{strict:true});const pm=workspace.parametricManager,index=workspace.createIndex(),nativeRows=pm.stages.map(s=>s.solverSystem.allConstraints.filter(c=>!c.internal));let count=0;
 for(let si=0;si<sketch.stages.length;si++)for(let i=0;i<sketch.stages[si].constraints.length;i++){
  const row=sketch.stages[si].constraints[i];if(row.typeId!=='DistancePL')continue;
  if(++count>10000)throw Object.assign(Error('Supporting-line inspection exceeds limits.'),{code:'LIMIT'});
  const c=nativeRows[si]?.[i];
  if(!c||c.schema!==ConstraintDefinitions.DistancePL||!pointLineConstantsValid(c.constants)||c.objects.length!==2||c.objects.some((o,j)=>o!==index[row.objects[j]]))throw Object.assign(Error('Supporting-line native ownership changed.'),{code:'INVALID_TARGET'});
  c.resolveConstants(pm.constantResolver);validateConstraintGeometry(c);
  let inspection:any;try{inspection=inspectPointLineDistance(pm,c.objects[0],c.objects[1]);}catch(error){if(error?.code==='UNSUPPORTED_TARGET')continue;throw error;}const inverted=pointLineSide(c.constants.inverted);
  out.set(dimensionLocator(si,i,row),Object.freeze({...inspection.actual,inverted}));
 }
 return out;
}
