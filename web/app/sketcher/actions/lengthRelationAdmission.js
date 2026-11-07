import {AlgNumConstraint, ConstraintDefinitions} from '../constr/ANConstraints';
import {Segment} from '../shapes/segment';
import {isInstanceOf} from './matchUtils';

// Geometry and solver admission only. The caller resolves current objects and
// owns transaction start, rollback, lifetime checks and refresh.
export function prepareLengthRelation(pm, objects, constants) {
  if(!pm||pm.inTransaction||!Array.isArray(objects)||objects.length!==2||objects[0]===objects[1]||
      objects.some(o=>!isInstanceOf(o,Segment)||typeof o.id!=='string'||!o.id||!o.stage||!pm.stages.includes(o.stage))||objects[0].id===objects[1].id) {
    throw Error('Choose two distinct segments in the current sketch.');
  }
  const stage=objects[0].stage.index>=objects[1].stage.index?objects[0].stage:objects[1].stage;
  if(objects.some(o=>o.generator&&o.stage===stage))throw Error('Cannot constrain a generated segment in the same stage.');
  const constraint=new AlgNumConstraint(ConstraintDefinitions.LengthRelation,objects,{...constants});
  constraint.validateCandidateConstants(constraint.constants,v=>pm.constantResolver(v));
  const validate=stages=>{
    if(constraint.stage!==stage||!stages.includes(stage)||!stage.algNumSystem.allConstraints.includes(constraint))throw Error('The length relation was not added.');
    for(const s of stages){const system=s.algNumSystem,previous=system.transactionBefore;
      for(const current of system.allConstraints){
        const wasRejected=previous.conflicting.has(current)&&!previous.redundant.has(current);
        const nowRejected=system.conflicting.has(current)&&!system.redundant.has(current);
        if((current===constraint||!wasRejected)&&nowRejected)throw Error('The length relation conflicts with existing constraints.');
      }
    }
  };
  return {constraint,stage,validate};
}
