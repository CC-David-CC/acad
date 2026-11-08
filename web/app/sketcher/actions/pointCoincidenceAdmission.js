import {AlgNumConstraint,ConstraintDefinitions} from '../constr/ANConstraints';
import {EndPoint} from '../shapes/point';
import {isInstanceOf} from './matchUtils';
import {withAdmissionCause} from '../constr/admissionCause.mjs';
const fail=(code,message)=>Object.assign(Error(message),{code});
// Pure actual model inspection. Safe inside the private captured-coordinate IO
// visitor: no transaction, solver, row insertion or publication is performed.
// A new proposal only references genuine owned Params of the actual points.
export function inspectPointCoincidence(pm,objects){
 if(!pm||!Array.isArray(objects)||objects.length!==2||objects[0]===objects[1]||objects[0]?.id===objects[1]?.id||objects.some(p=>!isInstanceOf(p,EndPoint)||typeof p.id!=='string'||!p.id||p.id.length>256||!p.stage||!pm.stages.includes(p.stage)||![p.x,p.y].every(Number.isFinite)))throw fail('COINCIDENCE_TARGET','Choose two distinct current nongenerated points.');
 const stage=objects.reduce((s,p)=>p.stage.index>s.index?p.stage:s,objects[0].stage);
 for(const point of objects){let root=point,steps=0;while(root.parent){if(++steps>64)throw fail('COINCIDENCE_TARGET','Point parent ownership exceeds its bound.');root=root.parent;}if(root.generator||root.isGenerated)throw fail('GENERATED_TARGET','Coincidence targets must be nongenerated authored points.');}
 if(objects[0].params.x===objects[1].params.x||objects[0].params.y===objects[1].params.y)throw fail('COINCIDENCE_TARGET','Distinct point targets must not alias actual coordinate parameters.');
 // Preserve the ACTUAL row order. A reversed request means the same relation,
 // whereas a transitive A-C relation is a genuine new row, not a graph no-op.
 const matches=stage.algNumSystem.allConstraints.filter(c=>!c.internal&&c.schema===ConstraintDefinitions.PCoincident&&c.objects.length===2&&((c.objects[0]===objects[0]&&c.objects[1]===objects[1])||(c.objects[0]===objects[1]&&c.objects[1]===objects[0])));
 if(matches.length>1)throw fail('AMBIGUOUS_TARGET','More than one actual coincidence row has this unordered pair.');
 const existing=matches.length===1,constraint=matches[0]||new AlgNumConstraint(ConstraintDefinitions.PCoincident,objects);
 return{constraint,stage,existing};
}

// Mutation preparation remains forbidden inside any active transaction. The
// captured visitor uses inspection above; it cannot bypass this stateful guard.
export function preparePointCoincidence(pm,objects){
 if(!pm||pm.inTransaction)throw fail('COINCIDENCE_TARGET','Choose two distinct current nongenerated points.');
 const {constraint,stage,existing}=inspectPointCoincidence(pm,objects);
 const validate=stages=>{const system=constraint.stage?.algNumSystem;if(!system||constraint.stage!==stage||!system.allConstraints.includes(constraint)||!existing&&!stages.includes(stage))throw fail('COINCIDENCE_TARGET','The actual coincidence row was not admitted in its owned stage.');
  for(const current of stages){if(!pm.stages.includes(current))throw fail('COINCIDENCE_TARGET','Constraint stage ownership changed.');for(const c of current.algNumSystem.allConstraints){const sys=current.algNumSystem;if(sys.conflicting.has(c)&&!sys.redundant.has(c))throw withAdmissionCause(fail('COINCIDENCE_REJECTED','Point coincidence was rejected by the actual sketch admission.'),sys.getAdmissionCause(c));}}
 };
 return{constraint,stage,existing,validate};
}
