import {AlgNumConstraint,ConstraintDefinitions} from '../constr/ANConstraints';
import {EndPoint} from '../shapes/point';
import {Segment} from '../shapes/segment';
import {isInstanceOf} from './matchUtils';
import {directionalRelationValid} from '../constr/lineRelationDomain.mjs';

// Shared admission for the real UI and headless workspace. Callers own target
// membership, transaction/history, rollback and publication. Both supporting
// segments and the symmetry axis retain live nondegenerate directions.
export function prepareLineRelation(pm,kind,objects) {
  const schema=kind==='collinear'?ConstraintDefinitions.Collinear:kind==='axis-symmetry'?ConstraintDefinitions.AxisSymmetry:null;
  const validTypes=Array.isArray(objects)&&(kind==='collinear'?objects.length===2&&objects.every(o=>isInstanceOf(o,Segment)):
    kind==='axis-symmetry'?objects.length===3&&objects.slice(0,2).every(o=>isInstanceOf(o,EndPoint))&&isInstanceOf(objects[2],Segment):false);
  if(!pm||pm.inTransaction||!schema||!validTypes||objects[0]===objects[1]||objects.some(o=>!o.stage||!pm.stages.includes(o.stage)))throw Error('Choose distinct current targets in a ready sketch and a live direction segment.');
  const stage=objects.reduce((a,o)=>o.stage.index>a.index?o.stage:a,objects[0].stage);
  if(objects.some(o=>o.generator&&o.stage===stage))throw Error('Cannot constrain a generated object in the same stage.');
  const constraint=new AlgNumConstraint(schema,objects);
  if(!directionalRelationValid(constraint))throw Object.assign(Error('The selected line direction is degenerate or inconsistent.'),{code:'DIRECTION_DOMAIN'});
  const samePair=(a,b,x,y)=>(a===x&&b===y)||(a===y&&b===x);
  const duplicate=pm.stages.flatMap(s=>s.algNumSystem.allConstraints).find(c=>{
    const system=c.stage.algNumSystem;
    return c.schema.id===schema.id&&!(system.isConflicting(c)&&!system.redundant.has(c))&&samePair(c.objects[0],c.objects[1],objects[0],objects[1])&&
      (kind==='collinear'||c.objects[2]===objects[2]);
  })||null;
  const validate=stages=>{
    const system=constraint.stage?.algNumSystem;
    if(!system||!stages.includes(constraint.stage)||!system.allConstraints.includes(constraint))throw Error('The relation was not added.');
    if(system.isConflicting(constraint)&&!system.redundant.has(constraint))throw Object.assign(Error('The relation conflicts with existing constraints.'),{code:'LINE_RELATION_CONFLICT'});
    if(!directionalRelationValid(constraint))throw Object.assign(Error('The line direction became degenerate or inconsistent.'),{code:'DIRECTION_DOMAIN'});
    for(const s of stages)for(const c of s.algNumSystem.allConstraints){const sys=s.algNumSystem,prev=sys.transactionBefore;
      if(!(prev.conflicting.has(c)&&!prev.redundant.has(c))&&sys.conflicting.has(c)&&!sys.redundant.has(c))throw Object.assign(Error('The relation would invalidate an existing constraint.'),{code:'LINE_RELATION_CONFLICT'});}
  };
  return {constraint,stage,duplicate,validate};
}
