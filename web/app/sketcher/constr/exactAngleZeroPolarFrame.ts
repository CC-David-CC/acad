import {AlgNumConstraint,ConstraintDefinitions} from './ANConstraints';
import {Polynomial,Monomial,POW_1_FN,SIN_FN,COS_FN} from './polynomial';
import {Param} from '../shapes/param';
import {SolverParam} from './solverParam';
import {Segment} from '../shapes/segment';
import {EndPoint} from '../shapes/point';
import {admissionCause,withAdmissionCause} from './admissionCause.mjs';

// This is an optional finite algebraic certificate, not a second solver. The
// ORIGINAL active registered linear rows must uniquely prove the endpoint
// values proposed by ordinary elimination. Sampling current coordinates or
// merely trusting usedApproximateReduction=false is never a fixed-value proof.
const WORK=1000000,BITS=8192,MIN=1e-9;
type Dyadic={n:bigint,e:number};
type Binding={constraint:any,schema:any,internal:boolean,objects:any[],params:any[],constants:Array<[string,any]>};
type Row={binding:Binding,index:number,constant:Dyadic,coefficients:Map<Param,Dyadic>};
type Fixed={param:Param,value:number,row:Row,dependencies:Fixed[]};
const stop=(message:string,resource=false):never=>{throw withAdmissionCause(Object.assign(Error(message),{code:resource?'RESOURCE_LIMIT':'POLAR_FRAME_PROOF_CHANGED'}),admissionCause(resource?'resource-limit':'retained-validation-failure'));};
function budget(){let work=0;return()=>{if(++work>WORK)stop('Exact Polar-frame proof exceeds its bounded work.',true);};}
function arithmetic(tick:()=>void){
 const view=new DataView(new ArrayBuffer(8));
 const normalize=(n:bigint,e:number):Dyadic=>{
  tick();if(n===0n)return{n:0n,e:0};
  const absolute=n<0n?-n:n;if(absolute.toString(2).length>BITS)stop('Exact Polar-frame arithmetic exceeds its bit bound.',true);
  while((n&65535n)===0n){tick();n>>=16n;e+=16;}while((n&1n)===0n){tick();n>>=1n;e++;}
  return{n,e};
 };
 const number=(value:number):Dyadic=>{
  tick();if(!Number.isFinite(value))stop('Nonfinite fixed-value certificate input.');
  if(value===0)return{n:0n,e:0};view.setFloat64(0,value,false);
  const bits=view.getBigUint64(0,false),raw=Number((bits>>52n)&2047n);
  let n=bits&((1n<<52n)-1n);if(raw)n|=1n<<52n;if(bits>>63n)n=-n;
  return normalize(n,raw?raw-1075:-1074);
 };
 const add=(a:Dyadic,b:Dyadic):Dyadic=>{tick();if(!a.n)return b;if(!b.n)return a;const e=Math.min(a.e,b.e);return normalize((a.n<<BigInt(a.e-e))+(b.n<<BigInt(b.e-e)),e);};
 const multiply=(a:Dyadic,b:Dyadic):Dyadic=>{tick();return normalize(a.n*b.n,a.e+b.e);};
 const equal=(a:Dyadic,b:Dyadic)=>a.n===b.n&&(a.n===0n||a.e===b.e);
 return{number,add,multiply,equal,negate:(a:Dyadic)=>({n:-a.n,e:a.e})};
}
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
 let sum=row.constant;for(const [param,coefficient]of row.coefficients){tick();if(!values.has(param))return false;sum=math.add(sum,math.multiply(coefficient,math.number(values.get(param))));}return sum.n===0n;
}
function copyPolynomial(p:Polynomial,tick:()=>void){
 const copy=new Polynomial(p.constant);copy.usedApproximateReduction=p.usedApproximateReduction;
 copy.monomials=p.monomials.map(source=>{tick();const m=new Monomial(source.constant);m.usedApproximateReduction=source.usedApproximateReduction;m.terms=source.terms.map(t=>{tick();return{...t};});return m;});return copy;
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
 const certify=(proposals:Map<Param,number>)=>{
  let changed=true;
  while(changed){changed=false;for(const row of rows){
   tick();const unknown=[...row.coefficients.keys()].filter(p=>!fixed.has(p));
   if(unknown.length!==1||!proposals.has(unknown[0]))continue;
   const parameter=unknown[0],value=proposals.get(parameter);if(!Number.isFinite(value))continue;
   const values=new Map<Param,number>(),dependencies:Fixed[]=[];
   for(const p of row.coefficients.keys()){tick();if(p===parameter)values.set(p,value);else{const prior=fixed.get(p);values.set(p,prior.value);dependencies.push(prior);}}
   if(exactRow(row,values,math,tick)){fixed.set(parameter,{param:parameter,value,row,dependencies});changed=true;}
  }}
 };
 const next=(polynomials:Polynomial[],eliminated:Map<Param,number>,substituted:Map<any,any>,approximate:Set<any>)=>{
  if(!frames.some(f=>{tick();return !f.done&&f.endpoints.every(p=>{tick();return eliminated.has(p);});}))return null;
  certify(eliminated);
  for(const frame of frames){
   tick();if(frame.done||frame.angle.get()!==0||eliminated.has(frame.angle)||substituted.has(frame.angle)||substituted.has(frame.length)||approximate.has(frame.angle)||approximate.has(frame.length)||!frame.endpoints.every(p=>fixed.has(p)&&eliminated.has(p)&&Object.is(fixed.get(p).value,eliminated.get(p))))continue;
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
