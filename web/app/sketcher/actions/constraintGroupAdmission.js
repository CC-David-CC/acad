import {AlgNumConstraint,ConstraintDefinitions} from '../constr/ANConstraints';
import {EndPoint} from '../shapes/point';
import {Segment} from '../shapes/segment';
import {isInstanceOf} from './matchUtils';
import {projectedDirectionValid} from '../constr/projectedDistanceDomain.mjs';
const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
const admitted=c=>{const s=c.stage.algNumSystem;return !s.isConflicting(c)||s.redundant.has(c);};
export function validateConstraintGroup(stages,constraints){
 for(const c of constraints){const stage=c.stage,sys=stage?.algNumSystem;if(!stage||!stages.includes(stage)||!sys.allConstraints.includes(c)||!admitted(c))fail('CONSTRAINT_GROUP_CONFLICT','The requested constraint group conflicts with existing intent.');}
 for(const stage of stages){const sys=stage.algNumSystem,prior=sys.transactionBefore;for(const c of sys.allConstraints)if(prior&&!(prior.conflicting.has(c)&&!prior.redundant.has(c))&&!admitted(c))fail('CONSTRAINT_GROUP_CONFLICT','The group would invalidate a retained constraint.');}
}
export function prepareConstraintGroup(pm,kind,objects,angleDegrees,action='create',midpointSchema='PointInMiddle'){
 if(!pm||pm.inTransaction||!Array.isArray(objects)||new Set(objects).size!==objects.length||objects.some(o=>!o?.stage||!pm.stages.includes(o.stage)||o.isGenerated)||objects.some(o=>o.stage!==objects[0].stage))fail('INVALID_TARGET','Select distinct current nongenerated objects in one authored stage.');
 const rows=pm.stages.flatMap(s=>s.algNumSystem.allConstraints),created=[],edited=[],constraints=[];
 if(kind==='midpoint'){
  if(action!=='create'||objects.length!==2||!isInstanceOf(objects[0],EndPoint)||!isInstanceOf(objects[1],Segment)||objects[0]===objects[1].a||objects[0]===objects[1].b||!projectedDirectionValid(objects[1]))fail('INVALID_TARGET','Choose one separate point and a nondegenerate segment.');
  const matches=rows.filter(c=>['PointInMiddle','Symmetry'].includes(c.schema.id)&&c.objects[0]===objects[0]&&c.objects[1]===objects[1]&&admitted(c));if(matches.length>1)fail('AMBIGUOUS_CONSTRAINT_GROUP','Several midpoint constraints already target this pair.');
  if(!['PointInMiddle','Symmetry'].includes(midpointSchema))fail('INVALID_REQUEST','Unknown midpoint schema.');
  const c=matches[0]||new AlgNumConstraint(ConstraintDefinitions[midpointSchema],objects);constraints.push(c);if(!matches.length)created.push(c);
 }else if(kind==='angle-chain'){
  if(!['create','edit'].includes(action)||objects.length<2||objects.length>16||objects.some(o=>!isInstanceOf(o,Segment)||!projectedDirectionValid(o)||o.params.t.get()<=0)||!Number.isFinite(angleDegrees)||angleDegrees<=0||angleDegrees>=180)fail('ANGLE_DOMAIN','Use two to16 current positive-direction segments and an angle strictly between0 and180 degrees.');
  const first=objects[0],base=((Math.atan2(first.b.y-first.a.y,first.b.x-first.a.x)*180/Math.PI)%360+360)%360;
  if(base+(objects.length-1)*angleDegrees>=360-1e-8)fail('ANGLE_BRANCH_UNSUPPORTED','This initial angle group cannot cross the directed zero/360-degree branch.');
  for(let i=1;i<objects.length;i++){
   const pair=objects.slice(i-1,i+1),matches=rows.filter(c=>c.schema.id==='AngleBetween'&&c.objects[0]===pair[0]&&c.objects[1]===pair[1]&&admitted(c));if(matches.length>1)fail('AMBIGUOUS_CONSTRAINT_GROUP','Several directed-angle constraints target one pair.');
   const c=matches[0];if(action==='edit'&&!c)fail('INVALID_TARGET','Every consecutive pair must have one inspected AngleBetween constraint.');
   if(c){if(action==='create'&&Number(c.constants?.angle)!==angleDegrees)fail('CONSTRAINT_GROUP_CONFLICT','A directed-angle pair already has a different authored angle.');if(Number(c.constants?.angle)!==angleDegrees)edited.push(c);constraints.push(c);}
   else{const added=new AlgNumConstraint(ConstraintDefinitions.AngleBetween,pair,{angle:String(angleDegrees)});created.push(added);constraints.push(added);}
  }
 }else fail('INVALID_REQUEST','Unknown constraint group.');
 const validate=stages=>{
  validateConstraintGroup(stages,constraints);
  if(kind==='midpoint'){const [p,s]=objects;if(Math.abs(p.x-(s.a.x+s.b.x)/2)>1e-6||Math.abs(p.y-(s.a.y+s.b.y)/2)>1e-6||!projectedDirectionValid(s))fail('RESIDUAL','The solved point is not the two-coordinate midpoint.');}
  else for(let i=1;i<objects.length;i++){const a=objects[i-1],b=objects[i];if(![a,b].every(s=>projectedDirectionValid(s)&&s.params.t.get()>0))fail('ANGLE_DOMAIN','A solved segment lost its admitted direction.');const actual=Math.atan2(b.b.y-b.a.y,b.b.x-b.a.x)-Math.atan2(a.b.y-a.a.y,a.b.x-a.a.x),degrees=((actual*180/Math.PI)%360+360)%360;if(Math.abs(degrees-angleDegrees)>1e-6)fail('RESIDUAL','Solved endpoint directions differ from the requested angle group.');}
 };
 return{constraints,created,edited,changed:created.length+edited.length>0,apply(manager){for(const c of edited)c.updateConstant('angle',String(angleDegrees));for(const c of created)manager._add(c);},validate};
}
