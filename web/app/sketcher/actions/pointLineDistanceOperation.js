import {inspectPointLineDistance} from './pointLineDistanceAdmission';
import {ConstraintDefinitions} from '../constr/ANConstraints';
import {pointLineConstantsValid} from '../constr/pointLineDistanceDomain.mjs';

// Human dialog custody is actual native object/stage identity, not a new closed
// source eligibility policy or a reconstruction from mutable IDs after Apply.
export function capturePointLineDistanceAction(viewer,point,line){
 const pm=viewer.parametricManager;
 inspectPointLineDistance(pm,point,line);
 const stages=[...pm.stages],ground=pm.groundStage,pointStage=point.stage,lineStage=line.stage,
       parent=point.parent,a=line.a,b=line.b;
 let applied=false;
 const current=()=>{
  if(applied||viewer.isDisposed?.()||viewer.parametricManager!==pm||pm.inTransaction||pm.groundStage!==ground||pm.stages.length!==stages.length||pm.stages.some((s,i)=>s!==stages[i])||point.stage!==pointStage||line.stage!==lineStage||point.parent!==parent||line.a!==a||line.b!==b)throw Error('The sketch targets changed while the distance dialog was open.');
  inspectPointLineDistance(pm,point,line);
 };
 current();
 return constraint=>{
  current();
  if(constraint?.schema!==ConstraintDefinitions.DistancePL||constraint.stage||constraint.objects.length!==2||constraint.objects[0]!==point||constraint.objects[1]!==line||!pointLineConstantsValid(constraint.constants))throw Error('The point-line distance dialog no longer owns its original intent.');
  constraint.validateCandidateConstants(constraint.constants,value=>pm.constantResolver(value));
  current();
  applied=true;
  // Preserve the original human operation: add this very dialog constraint,
  // including native multistage/generated rules, duplicate/rejected rows and
  // recovery behavior. Atomic closed creation uses its separate strict helper.
  pm.add(constraint);
 };
}
