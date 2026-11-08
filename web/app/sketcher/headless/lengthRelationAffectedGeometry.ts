import {HeadlessSketchWorkspace} from './workspace';
import {AlgNumConstraint,ConstraintDefinitions} from '../constr/ANConstraints';
import {GroundObjectsGeneratorSchema} from '../generators/groundObjectsGenerator';
import {Segment} from '../shapes/segment';
import {isInstanceOf} from '../actions/matchUtils';
import {evaluateCapturedSketch} from './capturedSketchEvaluation';
import {validateConstraintGeometry} from './sketchValidation';
import {capturedParameterOwnership,installCapturedAuxiliaryWitnesses} from './capturedParameterOwnership';
import {assertAllowedSolverGeometry} from './transitionGeometryPolicy.mjs';
const fail=(code:string,message:string):never=>{throw Object.assign(Error(message),{code});},WORK=100000;
export function firstLengthDifference(expected:any,actual:any){const pending:any[]=[[expected,actual,'source']];let visits=0;const brief=(v:any)=>v&&typeof v==='object'?(Array.isArray(v)?'[array]':'[object]'):String(v).slice(0,64);while(pending.length){if(++visits>WORK)return'difference exceeds diagnostic budget';const[a,b,path]=pending.pop();if(Object.is(a,b))continue;if(!a||!b||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return path.slice(-192)+': '+brief(a)+' -> '+brief(b)+(typeof a==='number'&&typeof b==='number'?' (delta='+String(b-a)+')':'');const x=Object.keys(a).sort(),y=Object.keys(b).sort();if(x.length!==y.length||x.some((k,i)=>k!==y[i]))return path.slice(-192)+': field membership differs';for(let i=x.length-1;i>=0;i--){const k=x[i];pending.push([a[k],b[k],path+'.'+k]);}}return'no difference';}

// Private source proof, never a public permission bitmap. Original equations
// are collected before reductions; only represented-zero monomials are absent.
export function captureLengthRelationScope(before:any,external:any,intent:any,freshEvidence:any[],auxiliaryWitnessBatch?:any){
 evaluateCapturedSketch(before,external,freshEvidence,undefined,auxiliaryWitnessBatch);
 const workspace=new HeadlessSketchWorkspace(external);
 return workspace.io.evaluateCapturedSketch(structuredClone(before),()=>{
  const ownership=capturedParameterOwnership(workspace);installCapturedAuxiliaryWitnesses(workspace,ownership,auxiliaryWitnessBatch);
  const pm=workspace.parametricManager,index=workspace.createIndex(),objects=intent.ids.map(id=>index[id]);
  if(objects.some(o=>!isInstanceOf(o,Segment)||!o.stage||!pm.stages.includes(o.stage))||objects[0]===objects[1])fail('INVALID_TARGET','Choose two distinct actual owned Segments.');
  const targetStage=objects[0].stage.index>=objects[1].stage.index?objects[0].stage:objects[1].stage;
  if(objects.some(o=>o.generator&&o.stage===targetStage))fail('INVALID_TARGET','A generated Segment cannot be constrained in its own stage.');
  const proposed=new AlgNumConstraint(ConstraintDefinitions.LengthRelation,objects,{factor:String(intent.factor),offset:String(intent.offset)});proposed.resolveConstants(pm.constantResolver);
  let originalSatisfied=true;try{validateConstraintGeometry(proposed);}catch(error){if(error?.code!=='RESIDUAL')throw error;originalSatisfied=false;}
  let visits=0;const charge=()=>{if(++visits>WORK)fail('LIMIT','Length relation dependency proof exceeds its bound.');},known=new Set<any>(),fixed=new Set<any>(),adjacency=new Map<any,any[]>();
  for(const stage of[pm.groundStage,...pm.stages])for(const object of stage.objects)object.visitParams(p=>{charge();known.add(p);});
  // Actual intrinsic generator identity, not a caller readOnly/constant flag.
  for(const generator of pm.groundStage.generators)if(generator.schema===GroundObjectsGeneratorSchema)for(const object of generator.generatedObjects||[]){if(index[object.id]!==object||object.stage!==pm.groundStage)continue;object.visitParams(p=>{charge();if(!Number.isFinite(p.get()))fail('INVALID_SCOPE','Ground parameters must be finite.');fixed.add(p);});}
  const all=pm.stages.flatMap(s=>s.solverSystem.allConstraints);
  for(const c of all){charge();for(const declared of ownership.constraint(c,c.stage))known.add(declared.parameter);c.resolveConstants(pm.constantResolver);
   // No rank, epsilon, reduced row or solved-looking-coordinate inference.
   if(c.schema===ConstraintDefinitions.LockPoint&&c.objects.length===1)for(const key of['x','y']){const p=c.objects[0].params?.[key],value=c.resolvedConstants?.[key];if(p&&known.has(p)&&typeof value==='number'&&Number.isFinite(value)&&Object.is(p.get(),value))fixed.add(p);}
  }
  function parameters(poly:any){charge();if(!poly||!Number.isFinite(poly.constant)||!Array.isArray(poly.monomials))fail('INVALID_SCOPE','Expected original finite polynomial data.');const result=new Set<any>();for(const m of poly.monomials){charge();if(!m||!Number.isFinite(m.constant)||!Array.isArray(m.terms))fail('INVALID_SCOPE','Expected original finite monomial data.');if(m.constant===0)continue;for(const term of m.terms){charge();const p=term.param;if(!known.has(p)||!Number.isFinite(p.get()))fail('INVALID_SCOPE','An original equation has an unowned parameter.');if(!fixed.has(p))result.add(p);}}return[...result];}
  const link=(group:any[])=>{for(const p of group){charge();const rows=adjacency.get(p)||[];rows.push(group);adjacency.set(p,rows);}};
  for(const c of all){const equations=[];c.collectPolynomials(equations);for(const equation of equations)link(parameters(equation));}
  // Real generator source/output identities are dependencies too.
  for(const stage of pm.stages)for(const generator of stage.generators){const group=new Set<any>(),add=(o:any)=>o.visitParams(p=>{charge();if(!known.has(p))fail('INVALID_SCOPE','Generator parameter ownership is unavailable.');if(!fixed.has(p))group.add(p);});generator.sourceObjects(add);for(const output of generator.generatedObjects||[])add(output);link([...group]);}
  const equations=[];proposed.collectPolynomials(equations);const reached=new Set<any>();for(const equation of equations)for(const p of parameters(equation))reached.add(p);
  const pending=[...reached];for(let at=0;at<pending.length;at++)for(const group of adjacency.get(pending[at])||[])for(const p of group){charge();if(!reached.has(p)){reached.add(p);pending.push(p);}}
  const fields=new Map<string,Set<string>>();
  for(const row of before.objects){charge();const o=index[row.id],allowed=new Set<string>(),point=(p:any,prefix:string)=>{for(const k of['x','y'])if(p?.params?.[k]&&reached.has(p.params[k]))allowed.add(prefix+k);},parameter=(p:any,name:string)=>{if(p&&reached.has(p))allowed.add(name);};if(!o||o.TYPE!==row.type||o.stage!==pm.stages[row.stage])fail('INVALID_SCOPE','Current source object ownership changed.');
   if(row.type==='Point')point(o,'');else if(row.type==='Segment'){point(o.a,'a.');point(o.b,'b.');}else if(row.type==='Circle'){point(o.c,'c.');parameter(o.r,'r');}else if(row.type==='Arc'){point(o.a,'a.');point(o.b,'b.');point(o.c,'c.');}else if(row.type==='Ellipse'||row.type==='EllipticalArc'){point(o.c,'c.');for(const k of['rx','ry','rot'])parameter(o[k],k);if(row.type==='EllipticalArc'){point(o.a,'a.');point(o.b,'b.');}}else if(row.type==='BezierCurve'){point(o.a,'cp1.');point(o.cp1,'cp2.');point(o.cp2,'cp3.');point(o.b,'cp4.');}else if(row.type==='BSpline')o.cPoints.forEach((p:any,i:number)=>point(p,'cPoints.'+i+'.'));else if(row.type==='RigidGroup'){parameter(o.tx,'transform.x');parameter(o.ty,'transform.y');parameter(o.angle,'transform.angle');}fields.set(row.id,allowed);
  }
  ownership.unchanged();return{fields,originalSatisfied,stage:targetStage.index};
 });
}
// Construct FROM original source plus an authenticated component delta. Never
// restore coordinates over an accepted/invalid whole optimizer result.
export function applyLengthRelationGeometry(original:any,warm:any,fields:Map<string,Set<string>>,useWarm:boolean){if(original.objects.length!==warm.objects.length)fail('INTENT_CHANGED','Length relation changed object membership.');return original.objects.map((row:any,i:number)=>{const observed=warm.objects[i];if(observed.id!==row.id||observed.type!==row.type)fail('INTENT_CHANGED','Length relation changed source identity.');assertAllowedSolverGeometry(row.type,row.data,observed.data);const result=structuredClone(row),allowed=fields.get(row.id)||new Set<string>();if(useWarm)for(const field of allowed){const keys=field.split('.');let from=observed.data,to=result.data;for(let j=0;j<keys.length-1;j++){from=from?.[keys[j]];to=to?.[keys[j]];}const key=keys[keys.length-1],value=from?.[key];if(typeof value!=='number'||!Number.isFinite(value)||!to||!Object.hasOwn(to,key))fail('INVALID_SCOPE','A scoped geometry field is unavailable.');to[key]=value;}return result;});}
export function assertLengthRelationGeometryScope(original:any,candidate:any,fields:Map<string,Set<string>>){const expected={...candidate,objects:applyLengthRelationGeometry(original,candidate,fields,true)},difference=firstLengthDifference(expected,candidate);if(difference!=='no difference')fail('UNRELATED_GEOMETRY_CHANGED','Length relation changed unrelated source: '+difference);}
