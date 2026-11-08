import {fixedSchemaFor} from '../constr/fixedEntityDomain.mjs';
const fail=(code:string,message:string):never=>{throw Object.assign(Error(message),{code});};
// CLOSED operation eligibility only. No public permission flag and no narrowing
// of the existing human action's prior-stage/recovery admission policy.
export function assertClosedFixedEntityTarget(pm:any,object:any,index=pm.viewer.createIndex()){
 const stage=object?.stage;if(!stage||!pm.stages.includes(stage)||!fixedSchemaFor(object)||object.parent||index[object.id]!==object||!stage.objects.has(object))fail('FIX_ENTITY_TARGET','Choose one current authored whole Segment, Circle or Arc root.');
 if(object.isGenerated||object.generator||object.generators.size)fail('GENERATED_TARGET','Closed Fix requires independently authored geometry without generator dependencies.');
 let count=0;object.traverse(o=>{if(++count>4||index[o.id]!==o||o.stage!==stage||o!==object&&o.parent!==object||o.isGenerated||o.generators.size||[...o.constraints].some(c=>c.schema?.id==='RigidGroup'))fail('FIX_ENTITY_TARGET','Closed whole-entity ownership is unsupported or ambiguous.');});
}
