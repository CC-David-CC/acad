import {AlgNumConstraint,ConstraintDefinitions} from '../constr/ANConstraints';
import {Segment} from '../shapes/segment';import {isInstanceOf} from './matchUtils';import {withAdmissionCause} from '../constr/admissionCause.mjs';
const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
// Human native ownership/recovery is separate from extra CLOSED eligibility.
export function inspectLengthFamilyObjects(pm,objects,closed=false){
 if(!pm||!Array.isArray(objects)||objects.length!==2||objects[0]===objects[1]||objects[0]?.id===objects[1]?.id||objects.some(o=>!isInstanceOf(o,Segment)||typeof o.id!=='string'||!o.id||!o.stage||o.stage!==pm.groundStage&&!pm.stages.includes(o.stage)||!Number.isFinite(o.params?.t?.get())))fail('LENGTH_RELATION_TARGET','Choose two current native Segments.');
 const first=pm.stages[0];if(!first)fail('LENGTH_RELATION_TARGET','An authored stage is required.');const stage=objects.reduce((s,o)=>o.stage.index>s.index?o.stage:s,first);
 if(objects.some(o=>o.generator&&o.stage===stage))fail('GENERATED_TARGET','A Segment cannot be constrained in its generating stage.');
 if(closed&&objects.some(o=>!pm.stages.includes(o.stage)||!o.stage.objects.has(o)||o.generator||o.isGenerated||o.id.length>256||Math.hypot(o.b.x-o.a.x,o.b.y-o.a.y)<=1e-9))fail('GENERATED_TARGET','Closed length relations require nongenerated noncollapsed Segment roots.');
 return stage;
}
export function validateLengthFamilyStages(pm,stages){for(const stage of stages){if(!pm.stages.includes(stage))fail('LENGTH_RELATION_TARGET','Length relation stage changed.');const sys=stage.algNumSystem;for(const c of sys.allConstraints)if(sys.conflicting.has(c)&&!sys.redundant.has(c)&&!(sys.transactionBefore?.conflicting.has(c)&&!sys.transactionBefore?.redundant.has(c)))throw withAdmissionCause(Object.assign(Error('Length relation was rejected by actual admission.'),{code:'LENGTH_RELATION_REJECTED'}),sys.getAdmissionCause(c));}}
export function prepareEqualLength(pm,objects,{closed=false,fresh=false}={}){
 if(pm?.inTransaction)fail('LENGTH_RELATION_TARGET','Finish the current sketch transaction.');const stage=inspectLengthFamilyObjects(pm,objects,closed),rows=fresh?[]:stage.algNumSystem.allConstraints.filter(c=>!c.internal&&c.schema===ConstraintDefinitions.EqualLength&&c.objects.length===2&&objects.every(o=>c.objects.includes(o)));
 if(rows.length>1)fail('AMBIGUOUS_TARGET','More than one equality covers this pair.');const constraint=rows[0]||new AlgNumConstraint(ConstraintDefinitions.EqualLength,objects),existing=!!rows.length;
 const validate=stages=>{if(constraint.stage!==stage||!stage.algNumSystem.allConstraints.includes(constraint))fail('LENGTH_RELATION_TARGET','The actual equality row changed.');validateLengthFamilyStages(pm,stages);};return{stage,constraint,existing,validate};
}
export function prepareLengthFamilyChange(pm,constraint,action,constants,closed=false){
 if(pm?.inTransaction||!constraint||![ConstraintDefinitions.EqualLength,ConstraintDefinitions.LengthRelation].includes(constraint.schema)||constraint.internal||!pm.stages.includes(constraint.stage)||!constraint.stage.algNumSystem.allConstraints.includes(constraint))fail('LENGTH_RELATION_TARGET','Choose a current native length-family row.');inspectLengthFamilyObjects(pm,constraint.objects,closed);
 if(!['edit','remove'].includes(action)||action==='edit'&&constraint.schema!==ConstraintDefinitions.LengthRelation)fail('INVALID_REQUEST','Equality is value-free; drive an existing real length.');if(action==='edit')constraint.validateCandidateConstants(constants,pm.constantResolver);
 return{constraint,stage:constraint.stage,mutate(){if(action==='remove')pm._removeConstraint(constraint);else{constraint.updateConstant('factor',constants.factor);constraint.updateConstant('offset',constants.offset);}},validate:stages=>validateLengthFamilyStages(pm,stages)};
}
