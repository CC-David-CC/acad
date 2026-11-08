import {AlgNumConstraint,ConstraintDefinitions} from '../constr/ANConstraints';
import {fixedGeometry,fixedEntityValid,fixedSchemaFor} from '../constr/fixedEntityDomain.mjs';
import {withAdmissionCause} from '../constr/admissionCause.mjs';
const fail=(code,message)=>Object.assign(Error(message),{code});
// Pure native-object preparation, safe in a captured decoder transaction.
// No optimization, PM mutation, admission, history or renderer authority.
export function inspectFixedEntity(pm,object,index=pm?.viewer?.createIndex?.()){
 const stage=object?.stage;
 if(!pm||!stage||!pm.stages.includes(stage)||!object||!fixedSchemaFor(object)||typeof object.id!=='string'||!object.id||object.id.length>256||index?.[object.id]!==object)throw fail('FIX_ENTITY_TARGET','Choose one current authored Segment, Circle or Arc root.');
 const captured=fixedGeometry(object),constants=Object.fromEntries(Object.entries(captured.values).map(([key,value])=>[key,String(value)]));
 let found=null;
 for(const s of pm.stages){for(const c of s.solverSystem.allConstraints){
  const sys=s.solverSystem;if(c.internal||c.schema!==ConstraintDefinitions[captured.schema]||c.objects.length!==1||c.objects[0]!==object||sys.conflicting.has(c)&&!sys.redundant.has(c))continue;
  if(!fixedEntityValid(c))throw fail('FIX_ENTITY_INVALID','The existing fixed entity is inconsistent.');found=c;break;
 }if(found)break;}
 const existing=found!==null,constraint=found||new AlgNumConstraint(ConstraintDefinitions[captured.schema],[object],constants);
 constraint.validateCandidateConstants(constraint.constants,pm.constantResolver);
 if(!fixedEntityValid(constraint))throw fail('FIX_ENTITY_INVALID','The actual whole entity cannot be fixed.');
 return{constraint,stage:existing?constraint.stage:stage,existing,object};
}
export function prepareFixedEntity(pm,object){
 if(!pm||pm.inTransaction)throw fail('FIX_ENTITY_UNAVAILABLE','Finish the current sketch operation before fixing an entity.');
 const prepared=inspectFixedEntity(pm,object),{constraint,stage,existing}=prepared;
 const validate=stages=>{if(!constraint.stage||constraint.stage!==stage||!stage.solverSystem.allConstraints.includes(constraint)||!existing&&!stages.includes(stage)||!fixedEntityValid(constraint))throw fail('FIX_ENTITY_INVALID','The actual fixed entity was not admitted consistently.');
  const relationSystem=constraint.stage.solverSystem;if(relationSystem.conflicting.has(constraint)&&!relationSystem.redundant.has(constraint))throw withAdmissionCause(fail('FIX_ENTITY_REJECTED','The entity Fix conflicts with existing constraints.'),relationSystem.getAdmissionCause(constraint));
  for(const s of stages)for(const c of s.solverSystem.allConstraints){const sys=s.solverSystem,prior=sys.transactionBefore,wasRejected=prior?.conflicting.has(c)&&!prior?.redundant.has(c);if(!wasRejected&&sys.conflicting.has(c)&&!sys.redundant.has(c))throw withAdmissionCause(fail('FIX_ENTITY_REJECTED','Fix would reject an existing original relationship.'),sys.getAdmissionCause(c));}
 };
 return{...prepared,validate};
}
