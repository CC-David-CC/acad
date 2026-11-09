import {AlgNumConstraint,ConstraintDefinitions} from '../constr/ANConstraints';
import {Segment} from '../shapes/segment';import {Circle} from '../shapes/circle';import {Arc} from '../shapes/arc';import {isInstanceOf} from './matchUtils';
import {tangentSpec,sameTangency} from '../headless/tangencyEnvelope.mjs';
import {assertRegisteredConstraintDomain} from '../constr/registeredConstraintPolicy.mjs';
import {withAdmissionCause} from '../constr/admissionCause.mjs';
const fail=(code,m)=>{throw Object.assign(Error(m),{code});};
// Common native object preparation intentionally retains human ground/multistage
// and recovery domains. Strict CLOSED root/generator eligibility is separate.
export function inspectTangencyObjects(pm,objects,typeId){
 if(!pm||!Array.isArray(objects)||objects.length!==2||objects[0]===objects[1]||objects[0]?.id===objects[1]?.id||objects.some(o=>!o?.stage||o.stage!==pm.groundStage&&!pm.stages.includes(o.stage)))fail('TANGENCY_TARGET','Choose two actual current tangent objects.');
 if(typeId==='TangentCC'){if(objects.some(o=>!isInstanceOf(o,Circle)||!Number.isFinite(o.r?.get()))||objects[0].r===objects[1].r)fail('TANGENCY_TARGET','Circle-Circle tangency requires two distinct actual Circle radii.');}
 else if(!['TangentLC','FiniteTangentLC'].includes(typeId)||!isInstanceOf(objects[0],Segment)||!(isInstanceOf(objects[1],Circle)||isInstanceOf(objects[1],Arc)))fail('TANGENCY_TARGET','Line-circular tangency requires actual Segment and Circle/Arc objects.');
 const first=pm.stages[0];if(!first)fail('TANGENCY_TARGET','A real authored constraint stage is required.');return objects.reduce((stage,o)=>o.stage.index>stage.index?o.stage:stage,first);
}
export function inspectTangency(pm,objects,spec,deduplicate=true){const stage=inspectTangencyObjects(pm,objects,spec.typeId),rows=deduplicate?stage.algNumSystem.allConstraints.filter(c=>!c.internal&&sameTangency(c.write(),spec)):[];if(rows.length>1)fail('AMBIGUOUS_TARGET','More than one matching actual tangent row exists.');return{stage,existing:rows.length===1,constraint:rows[0]||new AlgNumConstraint(ConstraintDefinitions[spec.typeId],objects,{...spec.constants})};}
export function inspectClosedTangency(pm,objects,spec,deduplicate=true){const r=inspectTangency(pm,objects,spec,deduplicate);for(const o of objects)if(!pm.stages.includes(o.stage)||!o.stage.objects.has(o)||o.parent||o.generator||o.isGenerated||typeof o.id!=='string'||o.id.length>256)fail('GENERATED_TARGET','Closed tangency requires actual nongenerated authored roots.');return r;}
export function prepareTangency(pm,objects,spec,deduplicate=true){if(!pm||pm.inTransaction)fail('TANGENCY_TARGET','Finish the current sketch transaction.');const result=inspectTangency(pm,objects,spec,deduplicate);return{...result,validate:stages=>{
 const c=result.constraint,sys=c.stage?.algNumSystem;if(c.stage!==result.stage||!sys?.allConstraints.includes(c))fail('TANGENCY_TARGET','The actual tangent row lost stage ownership.');
 // Do not turn a prior human rejected row into a new global policy restriction.
 for(const stage of stages)for(const row of stage.algNumSystem.allConstraints){const s=stage.algNumSystem;if(s.conflicting.has(row)&&!s.redundant.has(row)&&!(s.transactionBefore?.conflicting.has(row)&&!s.transactionBefore?.redundant.has(row)))throw withAdmissionCause(Object.assign(Error('Tangency was rejected by actual native admission.'),{code:'TANGENCY_REJECTED'}),s.getAdmissionCause(row));}
 if(sys.conflicting.has(c)&&!sys.redundant.has(c))throw withAdmissionCause(Object.assign(Error('Tangency conflicts with retained constraints.'),{code:'TANGENCY_REJECTED'}),sys.getAdmissionCause(c));
 assertRegisteredConstraintDomain(c);
 }};}
// Existing human TangentLC/Bezier action is untouched. This preparation is used
// only by new explicit mechanical finite/circle-circle human variants.
export function prepareHumanTangency(pm,objects,spec){return prepareTangency(pm,objects,spec,false);}
