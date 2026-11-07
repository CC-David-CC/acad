import {AlgNumConstraint, ConstraintDefinitions} from '../constr/ANConstraints';
import {Circle} from '../shapes/circle';
import {Arc} from '../shapes/arc';
import {isInstanceOf} from './matchUtils';

// Pure admission preparation. The caller owns membership, transaction,
// rollback, lifetime and presentation; this helper never touches a viewer.
export function prepareDiameter(pm,object,diameter){
 if(!pm||pm.inTransaction||!object||!(isInstanceOf(object,Circle)||isInstanceOf(object,Arc))||!object.stage||!pm.stages.includes(object.stage)||object.generator&&object.stage===pm.stage)throw Error('Choose one current circle or arc and a positive bounded diameter.');
 const resolved=typeof diameter==='number'?diameter:typeof diameter==='string'?Number(pm.constantResolver(diameter,ConstraintDefinitions.DiameterLength.constants.diameter)):NaN;
 if(!Number.isFinite(resolved)||resolved<=0||resolved>1e6)throw Error('Choose one current circle or arc and a positive bounded diameter.');
 const constraint=new AlgNumConstraint(ConstraintDefinitions.DiameterLength,[object],{diameter});
 constraint.validateCandidateConstants(constraint.constants,(value,field)=>pm.constantResolver(value,field));
 const validate=stages=>{
  const stage=constraint.stage,system=stage?.algNumSystem;
  if(!system||!stages.includes(stage)||!system.allConstraints.includes(constraint))throw Error('The diameter constraint was not added.');
  if(system.isConflicting(constraint)&&!system.redundant.has(constraint))throw Error('The diameter conflicts with existing constraints.');
  for(const current of stages)for(const existing of current.algNumSystem.allConstraints){const sys=current.algNumSystem,prev=sys.transactionBefore;
   if(!(prev.conflicting.has(existing)&&!prev.redundant.has(existing))&&sys.conflicting.has(existing)&&!sys.redundant.has(existing))throw Error('The diameter would invalidate an existing constraint.');}
 };
 return {constraint,validate};
}
