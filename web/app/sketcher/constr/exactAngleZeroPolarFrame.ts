import {AlgNumConstraint,ConstraintDefinitions} from './ANConstraints';
import {Polynomial,Monomial,POW_1_FN,SIN_FN,COS_FN} from './polynomial';
import {Param} from '../shapes/param';
import {SolverParam} from './solverParam';
import {Segment} from '../shapes/segment';
import {EndPoint} from '../shapes/point';
import {createExactPolarArithmetic as arithmetic,failExactPolarFrame as stop} from './exactPolarFrameArithmetic.mjs';

// This is an optional finite algebraic certificate, not a second solver. The
// ORIGINAL active registered linear rows must uniquely prove the endpoint
// values proposed by ordinary elimination. Sampling current coordinates or
// merely trusting usedApproximateReduction=false is never a fixed-value proof.
const WORK=1000000,MIN=1e-9;
type Dyadic={n:bigint,e:number};
type Binding={constraint:any,schema:any,internal:boolean,objects:any[],params:any[],constants:Array<[string,any]>};
type Row={binding:Binding,index:number,constant:Dyadic,coefficients:Map<Param,Dyadic>};
type Fixed={param:Param,value:number,row:Row,dependencies:Fixed[]};
function budget(){let work=0;return()=>{if(++work>WORK)stop('Exact Polar-frame proof exceeds its bounded work.',true);};}

function backed(p:any){return p instanceof Param&&p.solverParam instanceof SolverParam&&p.solverParam.objectParam===p&&Number.isFinite(p.get());}
function rootOwned(point:any,stage:any,tick:()=>void){
 if(!(point instanceof EndPoint)||point.stage!==stage||!backed(point.params.x)||!backed(point.params.y))return false;
 const seen=new Set();let root=point;
 while(root.parent){tick();if(seen.has(root)||!root.parent.children.has(root))return false;seen.add(root);root=root.parent;}
 return root.stage===stage&&stage.objects.has(root);
}
function captureBinding(c:any,stage:any,tick:()=>void):Binding|null{
 tick();if(!(c instanceof AlgNumConstraint)||ConstraintDefinitions[c.schema?.id]!==c.schema||c.stage!==stage||!Array.isArray(c.objects)||!Array.isArray(c.params)||c.params.some(p=>{tick();return !backed(p);}))return null;
 return{constraint:c,schema:c.schema,internal:c.internal,objects:[...c.objects],params:[...c.params],constants:Object.entries(c.constants||{})};
}
function sameBinding(b:Binding,system:any,active:Set<any>){
 const c=b.constraint,values=Object.entries(c.constants||{});
 return active.has(c)&&(!system.conflicting.has(c)||system.redundant.has(c))&&c.stage===system.stage&&c.schema===b.schema&&c.internal===b.internal&&ConstraintDefinitions[c.schema?.id]===c.schema&&
  c.objects.length===b.objects.length&&c.objects.every((o,i)=>o===b.objects[i])&&c.params.length===b.params.length&&c.params.every((p,i)=>p===b.params[i]&&backed(p))&&
  values.length===b.constants.length&&values.every(([k,v],i)=>k===b.constants[i][0]&&Object.is(v,b.constants[i][1]));
}
function linearRow(binding:Binding,index:number,p:Polynomial,math:ReturnType<typeof arithmetic>,tick:()=>void):Row|null{
 if(p.usedApproximateReduction||!Number.isFinite(p.constant))return null;
 const coefficients=new Map<Param,Dyadic>();
 for(const monomial of p.monomials){
  tick();if(!Number.isFinite(monomial.constant)||monomial.terms.length!==1||monomial.terms[0].fn!==POW_1_FN||!binding.params.includes(monomial.terms[0].param))return null;
  const parameter=monomial.terms[0].param,coefficient=math.add(coefficients.get(parameter)||math.number(0),math.number(monomial.constant));
  if(coefficient.n)coefficients.set(parameter,coefficient);else coefficients.delete(parameter);
 }
 return coefficients.size?{binding,index,constant:math.number(p.constant),coefficients}:null;
}
function exactRow(row:Row,values:Map<Param,number>,math:ReturnType<typeof arithmetic>,tick:()=>void){
 let sum=row.constant;for(const [param,coefficient]of row.coefficients){tick();if(!values.has(param))return false;sum=math.add(sum,math.multiply(coefficient,math.number(values.get(param))));}return !sum.n;
}
function copyPolynomial(p:Polynomial,tick:()=>void){
 const copy=new Polynomial(p.constant);copy.usedApproximateReduction=p.usedApproximateReduction;
 copy.monomials=p.monomials.map(source=>{tick();const m=new Monomial(source.constant);m.usedApproximateReduction=source.usedApproximateReduction;m.terms=source.terms.map(t=>{tick();return{...t};});return m;});return copy;
}

// Ordinary reduction can fix the representative of an original endpoint,
// rather than the endpoint itself. Resolve those PRIVATE reduction proposals
// without using current geometry as a seed. This is NOT the fixed-value proof:
// every resulting Number must still satisfy the original unique-row DAG below.
// Uncertified/nonlinear/unfixed/cyclic/inexact chains stay on the numerical path.
function proposalResolver(eliminated:Map<Param,number>,substituted:Map<Param,Polynomial>,approximate:Set<Param>,math:ReturnType<typeof arithmetic>,tick:()=>void){
 const cache=new Map<Param,number|null>(),active=new Set<Param>(),MAX_DEPTH=256;
 const resolve=(param:Param,depth=0):number|null=>{
  tick();if(cache.has(param))return cache.get(param);
  if(depth>MAX_DEPTH||active.has(param)||!backed(param)||approximate.has(param))return null;
  // There is no unambiguous proposal if two reduction owners claim this Param.
  if(eliminated.has(param)){
   const value=eliminated.get(param),result=!substituted.has(param)&&Number.isFinite(value)?value:null;
   cache.set(param,result);return result;
  }
  const alias=substituted.get(param);
  if(!(alias instanceof Polynomial)||alias.usedApproximateReduction||!Number.isFinite(alias.constant)){cache.set(param,null);return null;}
  active.add(param);let result:number|null=null;
  try{
   let value=alias.constant,sum=math.number(alias.constant),supported=true;
   for(const monomial of alias.monomials){
    tick();if(monomial.usedApproximateReduction||!Number.isFinite(monomial.constant)||monomial.terms.length!==1||monomial.terms[0].fn!==POW_1_FN){supported=false;break;}
    const leaf=resolve(monomial.terms[0].param,depth+1);if(leaf===null){supported=false;break;}
    const product=monomial.constant*leaf;value+=product;
    if(!Number.isFinite(product)||!Number.isFinite(value)){supported=false;break;}
    sum=math.add(sum,math.multiply(math.number(monomial.constant),math.number(leaf)));
   }
   // Rounded evaluation is a candidate only. Equality is exact represented
   // binary64/dyadic arithmetic, not equality after rounded multiplication.
   if(supported&&math.equal(sum,math.number(value)))result=value;
  }finally{active.delete(param);}
  cache.set(param,result);return result;
 };
 return (param:Param)=>resolve(param);
}

// Request/build-local, never a wire or persisted authority. No angle other than
// exact zero is certified. In that chart the unique regular Polar solution is
// t=B.x-A.x, including NEGATIVE t; the pi/-t gauge twin is not substituted in.
export function createExactAngleZeroPolarFrames(system:any){
 const tick=budget(),math=arithmetic(tick),rows:Row[]=[],frames:any[]=[],fixed=new Map<Param,Fixed>(),consumers=new Map<any,Array<{constraint:any,fn:any}>>();
 const linearSchemas=new Set([ConstraintDefinitions.LockPoint,ConstraintDefinitions.PCoincident,ConstraintDefinitions.SignedDistanceX,ConstraintDefinitions.SignedDistanceY]);
 const capture=(c:any,p:Polynomial,index:number)=>{
  // Preserve explicit gauge selectors: a raw angle equation or another
  // signed-t consumer may intentionally select the OTHER Polar chart.
  // Record actual original uses, including any opaque noncertificate schema.
  for(const m of p.monomials)for(const term of m.terms){tick();const uses=consumers.get(term.param)||[];uses.push({constraint:c,fn:term.fn});consumers.set(term.param,uses);}
  const binding=captureBinding(c,system.stage,tick);if(!binding)return;
  if(c.internal&&c.schema===ConstraintDefinitions.Polar&&index===0){
   const [segment,a,b]=c.objects,expected=segment instanceof Segment?[segment.params.ang,segment.params.t,a?.params?.x,a?.params?.y,b?.params?.x,b?.params?.y]:[];
   if(segment instanceof Segment&&c.objects.length===3&&segment.a===a&&segment.b===b&&a!==b&&a.parent===segment&&b.parent===segment&&segment.children.has(a)&&segment.children.has(b)&&segment.stage===system.stage&&system.stage.objects.has(segment)&&c.params.length===6&&new Set(c.params).size===6&&expected.every((param,i)=>param===c.params[i])&&c.params[0].get()===0&&Math.abs(c.params[1].get())>MIN&&rootOwned(a,system.stage,tick)&&rootOwned(b,system.stage,tick))
    frames.push({binding,segment,angle:c.params[0],length:c.params[1],endpoints:c.params.slice(2),done:false});
  }
  if(!frames.length||!linearSchemas.has(c.schema))return;
  const count=c.schema===ConstraintDefinitions.LockPoint?1:2;
  if(c.internal||c.objects.length!==count||c.objects.some(o=>!rootOwned(o,system.stage,tick))||c.params.length!==count*2||c.objects.some((o,i)=>c.params[2*i]!==o.params.x||c.params[2*i+1]!==o.params.y))return;
  const row=linearRow(binding,index,p,math,tick);if(row)rows.push(row);
 };
 const certify=(proposal:(param:Param)=>number|null)=>{
  let changed=true;
  while(changed){changed=false;for(const row of rows){
   tick();const unknown=[...row.coefficients.keys()].filter(p=>!fixed.has(p));
   if(unknown.length!==1)continue;
   const parameter=unknown[0],value=proposal(parameter);if(value===null||!Number.isFinite(value))continue;
   const values=new Map<Param,number>(),dependencies:Fixed[]=[];
   for(const p of row.coefficients.keys()){tick();if(p===parameter)values.set(p,value);else{const prior=fixed.get(p);values.set(p,prior.value);dependencies.push(prior);}}
   if(exactRow(row,values,math,tick)){fixed.set(parameter,{param:parameter,value,row,dependencies});changed=true;}
  }}
 };
 const next=(polynomials:Polynomial[],eliminated:Map<Param,number>,substituted:Map<any,any>,approximate:Set<any>)=>{
  // Rebuild this memoized view on each ordered restart: later ordinary pivots
  // can fix previously free alias leaves. No proposal cache survives a pass.
  const proposal=proposalResolver(eliminated,substituted,approximate,math,tick);
  if(!frames.some(f=>{tick();return !f.done&&f.endpoints.every(p=>{tick();return proposal(p)!==null;});}))return null;
  certify(proposal);
  for(const frame of frames){
   tick();if(frame.done||frame.angle.get()!==0||eliminated.has(frame.angle)||substituted.has(frame.angle)||substituted.has(frame.length)||approximate.has(frame.angle)||approximate.has(frame.length)||!frame.endpoints.every(p=>fixed.has(p)&&proposal(p)!==null&&Object.is(fixed.get(p).value,proposal(p))))continue;
   if((consumers.get(frame.angle)||[]).some(use=>use.constraint!==frame.binding.constraint&&use.fn!==SIN_FN&&use.fn!==COS_FN)||(consumers.get(frame.length)||[]).some(use=>use.constraint!==frame.binding.constraint))continue;
   const proofs:Fixed[]=frame.endpoints.map(p=>fixed.get(p)),[ax,ay,bx,by]=proofs.map(p=>p.value),value=bx-ax;
   if(!Number.isFinite(value)||Math.abs(value)<=MIN||!math.equal(math.number(ay),math.number(by))||!math.equal(math.add(math.number(bx),math.negate(math.number(ax))),math.number(value))||eliminated.has(frame.length)&&!Object.is(eliminated.get(frame.length),value))continue;
   const own=polynomials.filter(p=>{tick();return p&&system.polyToConstr.get(p)===frame.binding.constraint;});if(own.length!==2)continue;
   const replacements:Array<[Polynomial,Polynomial]>=[];let supported=true;
   for(const p of polynomials){if(!p||own.includes(p))continue;tick();const copy=copyPolynomial(p,tick),angle=copy.prepareElimination(frame.angle,0),length=angle&&(angle.apply(),copy.prepareElimination(frame.length,value));if(!length){supported=false;break;}length.apply();replacements.push([p,copy]);}
   if(!supported)continue;
   const verify=()=>{
    const check=budget(),exact=arithmetic(check),active=new Set(system.allConstraints);for(const _ of active)check();
    const nativeParams=[frame.segment.params.ang,frame.segment.params.t,frame.segment.a.params.x,frame.segment.a.params.y,frame.segment.b.params.x,frame.segment.b.params.y];
    if(!sameBinding(frame.binding,system,active)||nativeParams.some((p,i)=>p!==frame.binding.params[i])||frame.angle.get()!==0||!Object.is(frame.length.get(),value)||frame.segment.a!==frame.binding.objects[1]||frame.segment.b!==frame.binding.objects[2]||frame.endpoints.some((p,i)=>!Object.is(p.get(),proofs[i].value))||!rootOwned(frame.segment.a,system.stage,check)||!rootOwned(frame.segment.b,system.stage,check))stop('The exact Polar-frame source, branch or owned parameters changed.');
    const pending=[...proofs],seen=new Set<Fixed>();
    while(pending.length){check();const proof=pending.pop();if(seen.has(proof))continue;seen.add(proof);const row=proof.row;
     if(!sameBinding(row.binding,system,active)||row.binding.objects.some((point,i)=>!rootOwned(point,system.stage,check)||point.params.x!==row.binding.params[2*i]||point.params.y!==row.binding.params[2*i+1])||!Object.is(proof.param.get(),proof.value))stop('An original fixed-endpoint witness changed.');
     const original=[];row.binding.constraint.collectPolynomials(original);const actual=original[row.index]&&linearRow(row.binding,row.index,original[row.index],exact,check);
     if(!actual||!exact.equal(actual.constant,row.constant)||actual.coefficients.size!==row.coefficients.size||[...actual.coefficients].some(([p,v])=>!row.coefficients.has(p)||!exact.equal(v,row.coefficients.get(p))))stop('An original fixed-endpoint equation changed.');
     const values=new Map<Param,number>([[proof.param,proof.value]]);for(const prior of proof.dependencies){check();values.set(prior.param,prior.value);pending.push(prior);}
     if(!exactRow(actual,values,exact,check))stop('An original fixed-endpoint equation is not exactly satisfied.');
    }
    const original=[];frame.binding.constraint.collectPolynomials(original);
    if(original.length!==2||original.some(p=>p.value()!==0)||!Number.isFinite(value)||Math.abs(value)<=MIN)stop('The original Polar equations or nondegenerate branch changed.');
   };
   return{constraint:frame.binding.constraint,angle:frame.angle,length:frame.length,value,rows:own,verify,apply(){
    if(frame.done)stop('An exact Polar-frame plan was already consumed.');frame.done=true;
    for(const [p,copy]of replacements){p.constant=copy.constant;p.monomials=copy.monomials;p.usedApproximateReduction=copy.usedApproximateReduction;}
    for(let i=0;i<polynomials.length;i++)if(own.includes(polynomials[i]))polynomials[i]=null;
   }};
  }
  return null;
 };
 return{capture,next};
}

// PRIVATE native-solver reuse only: real registered row/Param authentication,
// not serialized/public authority. Angle-zero frame behavior above is unchanged.
export const exactFixedInputInternals=Object.freeze({backed,rootOwned,captureBinding,sameBinding,linearRow,exactRow,proposalResolver});
