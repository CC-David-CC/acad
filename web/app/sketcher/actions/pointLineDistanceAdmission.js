import {validateConstraintGeometry} from '../headless/sketchValidation';
import {GroundObjectsGeneratorSchema} from '../generators/groundObjectsGenerator';
import {AlgNumConstraint,ConstraintDefinitions} from '../constr/ANConstraints';
import {EndPoint} from '../shapes/point';
import {Segment} from '../shapes/segment';
import {isInstanceOf} from './matchUtils';
import {pointLineConstantsValid,pointLineDistanceValid,pointLineSide,pointLineNativeGeometry} from '../constr/pointLineDistanceDomain.mjs';
import {withAdmissionCause} from '../constr/admissionCause.mjs';
const fail=(code,message)=>Object.assign(Error(message),{code});
function rootOf(object){let root=object,depth=0;while(root.parent){if(++depth>64)throw fail('LIMIT','Point ownership exceeds its bound.');root=root.parent;}return root;}
// Shared native math/current-object inspection, also usable while IO captures a
// transaction. Ordinary closed-source eligibility is deliberately a separate
// policy: human native endpoints may belong to other real shapes or earlier
// generated stages. Native pm._add remains the human stage/dependency authority.
export function inspectPointLineDistance(pm,point,line){
 const currentStage=s=>!!s&&(pm.stages.includes(s)||s===pm.groundStage);
 if(!pm||!point||!line||!isInstanceOf(point,EndPoint)||!isInstanceOf(line,Segment)||!currentStage(point.stage)||!currentStage(line.stage)||!pm.stages[0])throw fail('POINT_LINE_TARGET','Choose a current native Point and Segment.');
 // Native roots are assigned by SolveStage, including actual generated and
 // ground roots. Check the real parent/child chain without imposing a closed
 // shape whitelist or rebuilding a whole-sketch index per inspected row.
 for(const object of [point,line]){
  const seen=new Set();let root=object;
  while(root.parent){
   if(seen.has(root)||!root.parent.children.has(root))throw fail('POINT_LINE_TARGET','Native point/line parent ownership changed.');
   seen.add(root);root=root.parent;
  }
  if(!root.stage?.objects.has(root))throw fail('POINT_LINE_TARGET','The actual native point/line is no longer current.');
 }
 // This is precisely pm._add's destination, including ground references.
 const stage=[point,line].reduce((s,o)=>o.stage.index>s.index?o.stage:s,pm.stages[0]);
 return {point,line,stage,actual:pointLineNativeGeometry(point,line)};
}
export function inspectClosedPointLineDistance(pm,point,line){
 const inspected=inspectPointLineDistance(pm,point,line),owner=rootOf(point);
 const groundOwner=owner.stage===pm.groundStage&&[...pm.groundStage.generators].some(g=>g.schema===GroundObjectsGeneratorSchema&&g.generatedObjects.includes(owner));
 if(!pm.stages.includes(line.stage)||!['Point','Segment','Circle','Arc'].includes(owner.TYPE)||owner.generator&&!groundOwner||line.generator)throw fail('UNSUPPORTED_TARGET','Closed supporting-line targets require ordinary nongenerated point/line owners.');
 if(!(owner.stage?.objects?.has(owner)||groundOwner)||!line.stage.objects.has(line))throw fail('POINT_LINE_TARGET','The ordinary closed point/line owner is no longer current.');
 return {...inspected,owner};
}
const literal=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
export function prepareClosedPointLineDistance(pm,point,line,distance,inverted){
 if(pm?.inTransaction)throw fail('POINT_LINE_TARGET','Finish the current transaction before adding a distance.');
 const inspected=inspectClosedPointLineDistance(pm,point,line),side=pointLineSide(inverted),resolved=typeof distance==='number'?distance:typeof distance==='string'?Number(pm.constantResolver(distance)):NaN;
 if(side===null||!pointLineDistanceValid(resolved))throw fail('DISTANCE_DOMAIN','Use a nonnegative finite millimeter distance and a literal side.');
 const isLiteral=typeof distance==='number'||typeof distance==='string'&&literal.test(distance.trim());
 const existing=isLiteral?inspected.stage.solverSystem.allConstraints.filter(c=>!c.internal&&c.schema===ConstraintDefinitions.DistancePL&&c.objects.length===2&&c.objects[0]===point&&c.objects[1]===line&&pointLineConstantsValid(c.constants)&&pointLineSide(c.constants.inverted)===side&&(typeof c.constants.distance==='number'||typeof c.constants.distance==='string'&&literal.test(c.constants.distance.trim()))&&Number(c.constants.distance)===resolved):[];
 if(existing.length>1)throw fail('AMBIGUOUS_TARGET','Inspect and edit/remove one of the identical existing distances.');
 const constraint=existing[0]||new AlgNumConstraint(ConstraintDefinitions.DistancePL,[point,line],{distance,inverted});
 constraint.validateCandidateConstants(constraint.constants,v=>pm.constantResolver(v));
 if(existing.length){const sys=constraint.stage.solverSystem;if(sys.conflicting.has(constraint)&&!sys.redundant.has(constraint))throw withAdmissionCause(fail('DISTANCE_CONFLICT','The matching existing point-line row is not admitted.'),sys.getAdmissionCause(constraint));constraint.resolveConstants(pm.constantResolver);validateConstraintGeometry(constraint);}
 const validate=stages=>{
  if(!constraint.stage||constraint.stage!==inspected.stage||!stages.includes(inspected.stage)||!constraint.stage.solverSystem.allConstraints.includes(constraint))throw fail('INTENT_CHANGED','The actual point-line distance was not admitted.');
  inspectClosedPointLineDistance(pm,point,line);constraint.resolveConstants(pm.constantResolver);validateConstraintGeometry(constraint);
  for(const s of stages)for(const c of s.solverSystem.allConstraints){
   const sys=s.solverSystem,previous=sys.transactionBefore,wasRejected=previous?.conflicting.has(c)&&!previous.redundant.has(c);
   if((c===constraint||!wasRejected)&&sys.conflicting.has(c)&&!sys.redundant.has(c))throw withAdmissionCause(fail('DISTANCE_CONFLICT','Point-line distance conflicts with actual sketch admission.'),sys.getAdmissionCause(c));
  }
 };
 return {...inspected,constraint,existing:existing.length===1,validate};
}
