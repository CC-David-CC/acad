import {AlgNumConstraint, ConstraintDefinitions} from '../constr/ANConstraints';
import {Circle} from '../shapes/circle';
import {Arc} from '../shapes/arc';
import {isInstanceOf} from './matchUtils';
import {withAdmissionCause} from '../constr/admissionCause.mjs';

// Pure admission preparation. The caller owns membership, transaction,
// rollback, lifetime and presentation; this helper never touches a viewer.
export function prepareRadius(pm,object,radius){
 if(!pm||pm.inTransaction||!object||!(isInstanceOf(object,Circle)||isInstanceOf(object,Arc))||!object.stage||!pm.stages.includes(object.stage)||object.generator&&object.stage===pm.stage)throw Error('Choose one current circle or arc and a positive bounded radius.');
 const literal=typeof radius==='number'||typeof radius==='string'&&/^[+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(radius.trim());
 const resolved=literal?Number(radius):NaN;
 if(!Number.isFinite(resolved)||resolved<=0||resolved>1e6)throw Error('Choose one current circle or arc and a positive bounded radius.');
 const constraint=new AlgNumConstraint(ConstraintDefinitions.RadiusLength,[object],{length:radius});
 constraint.validateCandidateConstants(constraint.constants,(value,field)=>pm.constantResolver(value,field));
 const validate=stages=>{
  const stage=constraint.stage,system=stage?.algNumSystem;
  if(!system||!stages.includes(stage)||!system.allConstraints.includes(constraint))throw Error('The radius constraint was not added.');
  if(system.isConflicting(constraint)&&!system.redundant.has(constraint))throw withAdmissionCause(Error('The radius conflicts with existing constraints.'),system.getAdmissionCause(constraint));
  for(const current of stages)for(const existing of current.algNumSystem.allConstraints){const sys=current.algNumSystem,prev=sys.transactionBefore;
   if(!(prev.conflicting.has(existing)&&!prev.redundant.has(existing))&&sys.conflicting.has(existing)&&!sys.redundant.has(existing))throw withAdmissionCause(Error('The radius would invalidate an existing constraint.'),sys.getAdmissionCause(existing));}
 };
 return {constraint,validate};
}
