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
// PURE native inspection: also valid during IO's captured open transaction.
// It never adds/resolves/optimizes a row or grants a caller mutation permission.
export function inspectPointLineDistance(pm,point,line){
 if(!pm||!point||!line||!isInstanceOf(point,EndPoint)||!isInstanceOf(line,Segment)||!point.stage||!line.stage||!(pm.stages.includes(point.stage)||point.stage===pm.groundStage)||!pm.stages.includes(line.stage))throw fail('POINT_LINE_TARGET','Choose an inspected Point and an ordinary Segment.');
 const owner=rootOf(point),groundOwner=owner.stage===pm.groundStage&&[...pm.groundStage.generators].some(g=>g.schema===GroundObjectsGeneratorSchema&&g.generatedObjects.includes(owner)),owned=root=>root.stage?.objects?.has(root)||root===owner&&groundOwner;
 if(!owned(owner)||!owned(line))throw fail('POINT_LINE_TARGET','The actual native point/line owner is no longer current.');
 const stage=point.stage.index>line.stage.index?point.stage:line.stage;
 if(!['Point','Segment','Circle','Arc'].includes(owner.TYPE)||owner.generator&&!groundOwner||line.generator)throw fail('UNSUPPORTED_TARGET','DistancePL currently supports ordinary nongenerated point/line owners.');
 const actual=pointLineNativeGeometry(point,line);
 return {point,line,owner,stage,actual};
}
const literal=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
export function preparePointLineDistance(pm,point,line,distance,inverted){
 if(pm?.inTransaction)throw fail('POINT_LINE_TARGET','Finish the current transaction before adding a distance.');
 const inspected=inspectPointLineDistance(pm,point,line),side=pointLineSide(inverted),resolved=typeof distance==='number'?distance:typeof distance==='string'?Number(pm.constantResolver(distance)):NaN;
 if(side===null||!pointLineDistanceValid(resolved))throw fail('DISTANCE_DOMAIN','Use a nonnegative finite millimeter distance and a literal side.');
 const isLiteral=typeof distance==='number'||typeof distance==='string'&&literal.test(distance.trim());
 const existing=isLiteral?inspected.stage.solverSystem.allConstraints.filter(c=>!c.internal&&c.schema===ConstraintDefinitions.DistancePL&&c.objects.length===2&&c.objects[0]===point&&c.objects[1]===line&&pointLineConstantsValid(c.constants)&&pointLineSide(c.constants.inverted)===side&&(typeof c.constants.distance==='number'||typeof c.constants.distance==='string'&&literal.test(c.constants.distance.trim()))&&Number(c.constants.distance)===resolved):[];
 if(existing.length>1)throw fail('AMBIGUOUS_TARGET','Inspect and edit/remove one of the identical existing distances.');
 const constraint=existing[0]||new AlgNumConstraint(ConstraintDefinitions.DistancePL,[point,line],{distance,inverted});
 constraint.validateCandidateConstants(constraint.constants,v=>pm.constantResolver(v));
 if(existing.length){const sys=constraint.stage.solverSystem;if(sys.conflicting.has(constraint)&&!sys.redundant.has(constraint))throw withAdmissionCause(fail('DISTANCE_CONFLICT','The matching existing point-line row is not admitted.'),sys.getAdmissionCause(constraint));constraint.resolveConstants(pm.constantResolver);validateConstraintGeometry(constraint);}
 const validate=stages=>{
  if(!constraint.stage||constraint.stage!==inspected.stage||!stages.includes(inspected.stage)||!constraint.stage.solverSystem.allConstraints.includes(constraint))throw fail('INTENT_CHANGED','The actual point-line distance was not admitted.');
  inspectPointLineDistance(pm,point,line);constraint.resolveConstants(pm.constantResolver);validateConstraintGeometry(constraint);
  for(const s of stages)for(const c of s.solverSystem.allConstraints){const sys=s.solverSystem;if(sys.conflicting.has(c)&&!sys.redundant.has(c))throw withAdmissionCause(fail('DISTANCE_CONFLICT','Point-line distance conflicts with actual sketch admission.'),sys.getAdmissionCause(c));}
 };
 return {...inspected,constraint,existing:existing.length===1,validate};
}
