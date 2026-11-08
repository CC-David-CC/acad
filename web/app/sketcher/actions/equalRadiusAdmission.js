import {AlgNumConstraint,ConstraintDefinitions} from '../constr/ANConstraints';
import {Circle} from '../shapes/circle';
import {Arc} from '../shapes/arc';
import {isInstanceOf} from './matchUtils';
import {withAdmissionCause,admissionCause} from '../constr/admissionCause.mjs';
import {assertRegisteredConstraintDomain} from '../constr/registeredConstraintPolicy.mjs';
const fail=(code,message)=>{throw Object.assign(Error(message),{code});};

// Pure real-model inspection, with no transaction, insertion or optimizer.
// The human recovery solve establishes the FINAL positive circular domain.
export function inspectEqualRadiusObjects(pm,objects){
 if(!pm||!Array.isArray(objects)||objects.length!==2||objects[0]===objects[1]||objects[0]?.id===objects[1]?.id||objects.some(o=>
  !(isInstanceOf(o,Circle)||isInstanceOf(o,Arc))||typeof o.id!=='string'||!o.id||!o.stage||
  o.stage!==pm.groundStage&&!pm.stages.includes(o.stage)||!Number.isFinite(o.r?.get())))
  fail('EQUAL_RADIUS_TARGET','Choose two current finite Circle/Arc objects.');
 if(objects[0].r===objects[1].r)fail('EQUAL_RADIUS_TARGET','Distinct Circle/Arc radii must not alias.');
 // Match PM._add: two actual ground references still place the equation in
 // stages[0]; only a later actual target stage raises that authored floor.
 const first=pm.stages[0];
 if(!first)fail('EQUAL_RADIUS_TARGET','An authored constraint stage is required.');
 return objects.reduce((stage,o)=>o.stage.index>stage.index?o.stage:stage,first);
}
export function inspectEqualRadius(pm,objects){
 const stage=inspectEqualRadiusObjects(pm,objects),rows=stage.algNumSystem.allConstraints.filter(c=>
  !c.internal&&c.schema===ConstraintDefinitions.EqualRadius&&c.objects.length===2&&
  ((c.objects[0]===objects[0]&&c.objects[1]===objects[1])||(c.objects[0]===objects[1]&&c.objects[1]===objects[0])));
 if(rows.length>1)fail('AMBIGUOUS_TARGET','More than one EqualRadius row has this unordered pair.');
 return{stage,existing:rows.length===1,constraint:rows[0]||new AlgNumConstraint(ConstraintDefinitions.EqualRadius,objects)};
}
// Extra CLOSED admission is separate from the human editor's recovery domain.
export function inspectClosedEqualRadius(pm,objects){
 const result=inspectEqualRadius(pm,objects);
 for(const o of objects){
  if(!pm.stages.includes(o.stage)||!o.stage.objects.has(o)||o.id.length>256||o.r.get()<=1e-9)
   fail('EQUAL_RADIUS_TARGET','Choose actual authored positive Circle/Arc roots.');
  if(o.generator||o.isGenerated)fail('GENERATED_TARGET','Closed EqualRadius requires nongenerated authored targets.');
 }
 return result;
}
export function validateEqualRadiusStages(pm,stages){
 for(const stage of stages){
  if(!pm.stages.includes(stage))fail('EQUAL_RADIUS_TARGET','EqualRadius stage ownership changed.');
  const sys=stage.algNumSystem;
  for(const c of sys.allConstraints)if(sys.conflicting.has(c)&&!sys.redundant.has(c)&&
   !(sys.transactionBefore?.conflicting.has(c)&&!sys.transactionBefore?.redundant.has(c)))
   throw withAdmissionCause(Object.assign(Error('EqualRadius was rejected by actual sketch admission.'),{code:'EQUAL_RADIUS_REJECTED'}),sys.getAdmissionCause(c));
 }
}
function prepared(pm,result){
 const validate=stages=>{
  const c=result.constraint,stage=c.stage,sys=stage?.algNumSystem;
  if(stage!==result.stage||!sys?.allConstraints.includes(c))fail('EQUAL_RADIUS_TARGET','The actual EqualRadius row was not admitted.');
  if(sys.conflicting.has(c)&&!sys.redundant.has(c))
   throw withAdmissionCause(Object.assign(Error('EqualRadius conflicts with existing constraints.'),{code:'EQUAL_RADIUS_REJECTED'}),sys.getAdmissionCause(c));
  // A finite degenerate initial human radius may recover through the REAL
  // solve; a final invalid circle is never accepted merely to preserve it.
  try{assertRegisteredConstraintDomain(c);}catch{
   throw withAdmissionCause(Object.assign(Error('EqualRadius has an invalid final circular domain.'),{code:'EQUAL_RADIUS_REJECTED'}),admissionCause('invalid-domain'));
  }
  validateEqualRadiusStages(pm,stages);
 };
 return{...result,validate};
}
export function prepareEqualRadius(pm,objects){
 if(!pm||pm.inTransaction)fail('EQUAL_RADIUS_TARGET','Finish the current sketch operation first.');
 return prepared(pm,inspectEqualRadius(pm,objects));
}
// HUMAN repeated selection retains fresh consecutive rows and its actual solve.
// CLOSED semantic no-op does not globally replace that prior recovery behavior.
export function prepareNewEqualRadius(pm,objects){
 if(!pm||pm.inTransaction)fail('EQUAL_RADIUS_TARGET','Finish the current sketch operation first.');
 const stage=inspectEqualRadiusObjects(pm,objects);
 return prepared(pm,{stage,existing:false,constraint:new AlgNumConstraint(ConstraintDefinitions.EqualRadius,objects)});
}
