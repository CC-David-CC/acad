import {AlgNumConstraint, ConstraintDefinitions} from '../constr/ANConstraints';
import {Circle} from '../shapes/circle';
import {Arc} from '../shapes/arc';
import {isInstanceOf} from './matchUtils';

// Geometry and existing solver admission only. The caller resolves current
// objects and owns transaction start/rollback, lifetime, history and refresh.
export function prepareConcentric(pm, objects) {
  if(!pm||pm.inTransaction||!Array.isArray(objects)||objects.length!==2||objects[0]===objects[1]||!objects[0]?.id||objects[0].id===objects[1]?.id)throw Error('Choose two distinct circles or arcs in an active sketch.');
  if(objects.some(o=>!o||!(isInstanceOf(o,Circle)||isInstanceOf(o,Arc))||!o.stage||!pm.stages.includes(o.stage)))throw Error('Choose two circles or arcs in this sketch.');
  const stage=objects[0].stage.index>=objects[1].stage.index?objects[0].stage:objects[1].stage;
  if(objects.some(o=>o.generator&&o.stage===stage))throw Error('Cannot constrain a generated object in the same stage.');
  const constraint=new AlgNumConstraint(ConstraintDefinitions.Concentric,objects);
  const validate=stages=>{
    const system=constraint.stage?.algNumSystem;
    if(!system||constraint.stage!==stage||!stages.includes(stage)||!system.allConstraints.includes(constraint))throw Error('The concentric constraint was not added.');
    if(system.isConflicting(constraint)&&!system.redundant.has(constraint))throw Error('The concentric constraint conflicts with existing constraints.');
    for(const currentStage of stages){
      const sys=currentStage.algNumSystem,before=sys.transactionBefore;
      for(const current of before.constraints){
        const wasRejected=before.conflicting.has(current)&&!before.redundant.has(current);
        if(!wasRejected&&sys.conflicting.has(current)&&!sys.redundant.has(current))throw Error('The concentric constraint would invalidate an existing constraint.');
      }
    }
  };
  return {constraint,stage,validate};
}
