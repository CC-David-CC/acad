import {AlgNumConstraint,ConstraintDefinitions} from '../constr/ANConstraints';
import {EndPoint} from '../shapes/point';
import {isInstanceOf} from './matchUtils';
import {drivingDimensionValueValid} from '../headless/drivingDimensionTarget.mjs';
import {withAdmissionCause} from '../constr/admissionCause.mjs';

// Shared human/Worker model admission. Zero distance between two distinct valid
// Point objects is meaningful. No coordinate coincidence weld or zero entity is
// manufactured here; original equations/domain checks remain the solver's own.
export function preparePointDistance(pm,objects,distance){
 const fail=message=>Object.assign(Error(message),{code:'POINT_DISTANCE_TARGET'});
 if(!pm||pm.inTransaction||!Array.isArray(objects)||objects.length!==2||objects[0]===objects[1]||objects[0]?.id===objects[1]?.id||objects.some(o=>!isInstanceOf(o,EndPoint)||!o.stage||!pm.stages.includes(o.stage)))throw fail('Choose two distinct current points.');
 const stage=objects.reduce((a,o)=>o.stage.index>a.index?o.stage:a,objects[0].stage);
 for(const point of objects){let root=point,steps=0;while(root.parent){if(++steps>64)throw fail('Point ownership exceeds its bound.');root=root.parent;}if(root.generator&&root.stage===stage)throw Object.assign(fail('Generated points cannot be constrained in their generating stage.'),{code:'GENERATED_TARGET'});}
 const resolved=typeof distance==='number'?distance:typeof distance==='string'?Number(pm.constantResolver(distance)):NaN;
 if(!drivingDimensionValueValid('DistancePP',resolved))throw Object.assign(Error('Use Euclidean millimeters from0 to1,000,000.'),{code:'DISTANCE_DOMAIN'});
 // Only identical ordered, literal intent is a no-op. A name binding is not
 // silently replaced by its current numeric value, and source refs stay intact.
 const literal=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
 const requestedLiteral=typeof distance==='number'||typeof distance==='string'&&literal.test(distance.trim());
 const existing=requestedLiteral?stage.algNumSystem.allConstraints.filter(c=>!c.internal&&c.schema.id==='DistancePP'&&c.objects.length===2&&c.objects.every((o,i)=>o===objects[i])&&(typeof c.constants.distance==='number'||typeof c.constants.distance==='string'&&literal.test(c.constants.distance.trim()))&&Number(c.constants.distance)===resolved):[];
 if(existing.length>1)throw Object.assign(fail('Inspect and edit/remove one of the existing identical point distances.'),{code:'AMBIGUOUS_TARGET'});
 const constraint=existing[0]||new AlgNumConstraint(ConstraintDefinitions.DistancePP,objects,{distance});constraint.validateCandidateConstants(constraint.constants,v=>pm.constantResolver(v));
 const validate=stages=>{const system=constraint.stage?.algNumSystem;if(!system||constraint.stage!==stage||!stages.includes(stage)||!system.allConstraints.includes(constraint))throw fail('The actual point distance was not added.');for(const current of stages)for(const c of current.algNumSystem.allConstraints)if(current.algNumSystem.conflicting.has(c)&&!current.algNumSystem.redundant.has(c))throw withAdmissionCause(Object.assign(Error('The Euclidean point distance conflicts with the current sketch solve.'),{code:'DISTANCE_CONFLICT'}),current.algNumSystem.getAdmissionCause(c));};
 return {constraint,stage,existing:existing.length===1,validate};
}
