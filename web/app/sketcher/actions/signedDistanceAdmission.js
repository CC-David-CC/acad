import {AlgNumConstraint,ConstraintDefinitions} from '../constr/ANConstraints';
import {EndPoint} from '../shapes/point';
import {Segment} from '../shapes/segment';
import {isInstanceOf} from './matchUtils';
import {projectedDirectionValid} from '../constr/projectedDistanceDomain.mjs';

// Shared UI/Worker admission only. The caller owns membership, transaction,
// rollback, source history and publication. A projected datum stays live.
export function prepareSignedDistance(pm,axis,objects,distance) {
  const schema=axis==='x'?ConstraintDefinitions.SignedDistanceX:axis==='y'?ConstraintDefinitions.SignedDistanceY:axis==='projected'?ConstraintDefinitions.ProjectedDistance:null;
  if(!pm||pm.inTransaction||!schema||!Array.isArray(objects)||objects.length!==(axis==='projected'?3:2)||objects[0]===objects[1]||
     !objects.slice(0,2).every(o=>isInstanceOf(o,EndPoint))||(axis==='projected'&&!isInstanceOf(objects[2],Segment))||
     objects.some(o=>!o.stage||!pm.stages.includes(o.stage)))throw Error('Choose two distinct current points and, for projection, one direction segment.');
  if(axis==='projected'&&!projectedDirectionValid(objects[2]))throw Object.assign(Error('The projection direction is degenerate or inconsistent.'),{code:'PROJECTED_DIRECTION_DOMAIN'});
  const stage=objects.reduce((a,o)=>o.stage.index>a.index?o.stage:a,objects[0].stage);
  if(objects.some(o=>o.generator&&o.stage===stage))throw Object.assign(Error('Cannot constrain a generated object in the same stage.'),{code:'GENERATED_TARGET'});
  const resolved=typeof distance==='number'?distance:typeof distance==='string'?Number(pm.constantResolver(distance)):NaN;
  if(!Number.isFinite(resolved)||Math.abs(resolved)>1e6)throw Object.assign(Error('Enter a finite bounded signed distance.'),{code:'DISTANCE_DOMAIN'});
  const constraint=new AlgNumConstraint(schema,objects,{distance});
  constraint.validateCandidateConstants(constraint.constants,v=>pm.constantResolver(v));
  const validate=stages=>{
    const system=constraint.stage?.algNumSystem;
    if(!system||!stages.includes(constraint.stage)||!system.allConstraints.includes(constraint))throw Error('The distance constraint was not added.');
    if(system.isConflicting(constraint)&&!system.redundant.has(constraint))throw Object.assign(Error('The signed distance conflicts with existing constraints.'),{code:'DISTANCE_CONFLICT'});
    if(axis==='projected'&&!projectedDirectionValid(objects[2]))throw Object.assign(Error('The projection direction became degenerate or inconsistent.'),{code:'PROJECTED_DIRECTION_DOMAIN'});
    for(const s of stages)for(const c of s.algNumSystem.allConstraints){const sys=s.algNumSystem,prev=sys.transactionBefore;
      if(!(prev.conflicting.has(c)&&!prev.redundant.has(c))&&sys.conflicting.has(c)&&!sys.redundant.has(c))throw Object.assign(Error('The distance would invalidate an existing constraint.'),{code:'DISTANCE_CONFLICT'});}
  };
  return {constraint,validate};
}
