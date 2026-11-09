import {AlgNumConstraint,ConstraintDefinitions} from './ANConstraints';
import {Polynomial,POW_1_FN,POW_2_FN} from './polynomial';
import {Circle} from '../shapes/circle';import {EndPoint} from '../shapes/point';
import {exactFixedInputInternals as shared} from './exactAngleZeroPolarFrame';
import {createExactPolarArithmetic as arithmetic} from './exactPolarFrameArithmetic.mjs';
import {assertRegisteredConstraintDomain,registeredResidualProfile,registeredDomainFailureCause} from './registeredConstraintPolicy.mjs';
import {admissionCause,withAdmissionCause} from './admissionCause.mjs';
const WORK=1000000;
function stop(message:string,resource=false):never{throw withAdmissionCause(Object.assign(Error(message),{code:resource?'RESOURCE_LIMIT':'TANGENT_FIXED_INPUT_PROOF_CHANGED'}),admissionCause(resource?'resource-limit':'retained-validation-failure'));}
// Optional original-equation certificate, not a second solver. No current value,
// residual/rank, global POW_2 or rounded coefficient product proves fixedness.
export function createExactTangentCCFixedInputs(system:any){
 // No extra row census/proof construction in models without an active or
 // retained redundant TangentCC. No legacy model limit is introduced here.
 if(!system.allConstraints.some(c=>c.schema===ConstraintDefinitions.TangentCC&&(!system.conflicting.has(c)||system.redundant.has(c))))return{
  capture:(_c:any,_p:Polynomial,_index:number)=>{},
  next:(_p:Polynomial[],_e:Map<any,number>,_s:Map<any,Polynomial>,_a:Set<any>)=>null
 };
 let work=0,validationPass:any=null;const tick=()=>{if(++work>WORK)stop('Exact tangent fixed-input proof exceeds its work budget.',true);},math=arithmetic(tick),rows:any[]=[],targets:any[]=[],fixed=new Map<any,any>(),resolver=system.expressionResolver;
 const pointSchemas=new Set([ConstraintDefinitions.LockPoint,ConstraintDefinitions.PCoincident,ConstraintDefinitions.SignedDistanceX,ConstraintDefinitions.SignedDistanceY]),radiusSchemas=new Set([ConstraintDefinitions.RadiusLength,ConstraintDefinitions.DiameterLength,ConstraintDefinitions.EqualRadius]);
 function ownCircle(o:any,charge=tick){charge();return o instanceof Circle&&o.stage===system.stage&&system.stage.objects.has(o)&&o.c instanceof EndPoint&&o.c.parent===o&&o.children.has(o.c)&&shared.rootOwned(o.c,system.stage,charge)&&shared.backed(o.r);}
 function domain(c:any){try{domain(c);}catch(error){throw withAdmissionCause(error,registeredDomainFailureCause(error));}}
 function supportOwned(c:any,charge=tick){
  charge();if(c.internal||c.schema===ConstraintDefinitions.TangentCC)return false;
  if(pointSchemas.has(c.schema)){const count=c.schema===ConstraintDefinitions.LockPoint?1:2;return c.objects.length===count&&c.params.length===count*2&&c.objects.every((o,i)=>shared.rootOwned(o,system.stage,charge)&&c.params[2*i]===o.params.x&&c.params[2*i+1]===o.params.y);}
  if(radiusSchemas.has(c.schema)){const count=c.schema===ConstraintDefinitions.EqualRadius?2:1;return c.objects.length===count&&c.params.length===count&&c.objects.every((o,i)=>ownCircle(o,charge)&&c.params[i]===o.r);}
  if(c.schema===ConstraintDefinitions.FixCircle){const o=c.objects[0];return c.objects.length===1&&ownCircle(o,charge)&&c.params.length===3&&[o.c.params.x,o.c.params.y,o.r].every((p,i)=>p===c.params[i]);}
  return false;
 }
 function targetOwned(c:any,charge=tick){charge();return c instanceof AlgNumConstraint&&c.schema===ConstraintDefinitions.TangentCC&&!c.internal&&c.stage===system.stage&&c.objects.length===2&&c.objects[0]!==c.objects[1]&&c.objects.every(o=>ownCircle(o,charge))&&c.params.length===6&&new Set(c.params).size===6&&[c.objects[0].c.params.x,c.objects[0].c.params.y,c.objects[1].c.params.x,c.objects[1].c.params.y,c.objects[0].r,c.objects[1].r].every((p,i)=>p===c.params[i])&&['external','first-contains-second','second-contains-first'].includes(c.constants?.branch);}
 function snapshot(p:any,params:any[]){
  tick();if(!(p instanceof Polynomial)||p.usedApproximateReduction||!Number.isFinite(p.constant))return null;const monomials=[];
  for(const m of p.monomials){tick();if(m.usedApproximateReduction||!Number.isFinite(m.constant))return null;const terms=[];for(const t of m.terms){tick();if(!params.includes(t.param)||t.fn!==POW_1_FN&&t.fn!==POW_2_FN)return null;terms.push({param:t.param,fn:t.fn});}monomials.push({constant:m.constant,terms});}return{constant:p.constant,monomials};
 }
 function samePolynomial(a:any,b:any){return !!a&&!!b&&Object.is(a.constant,b.constant)&&a.monomials.length===b.monomials.length&&a.monomials.every((m,i)=>{tick();const n=b.monomials[i];return Object.is(m.constant,n.constant)&&m.terms.length===n.terms.length&&m.terms.every((t,j)=>t.param===n.terms[j].param&&t.fn===n.terms[j].fn);});}
 function exactValue(p:any,values:Map<any,number>,exact=math,charge=tick){let sum=exact.number(p.constant);for(const m of p.monomials){charge();let product=exact.number(m.constant);for(const term of m.terms){charge();if(!values.has(term.param))return null;const value=exact.number(values.get(term.param));product=exact.multiply(product,term.fn===POW_2_FN?exact.multiply(value,value):value);}sum=exact.add(sum,product);}return sum;}
 const capture=(c:any,p:Polynomial,index:number)=>{
  const binding=shared.captureBinding(c,system.stage,tick);if(!binding)return;
  if(c.schema===ConstraintDefinitions.TangentCC){if(index!==0||!targetOwned(c))return;const original=snapshot(p,c.params);if(original)targets.push({binding,original,retained:system.redundant.has(c),done:false});return;}
  if(!supportOwned(c))return;const row=shared.linearRow(binding,index,p,math,tick);if(row)rows.push(row);
 };
 function certify(proposal:(p:any)=>number|null){let changed=true;while(changed){changed=false;for(const row of rows){tick();const unknown=[...row.coefficients.keys()].filter(p=>!fixed.has(p));if(unknown.length!==1)continue;const parameter=unknown[0],value=proposal(parameter);if(value===null||!Number.isFinite(value))continue;const values=new Map<any,number>(),dependencies=[];for(const p of row.coefficients.keys()){tick();if(p===parameter)values.set(p,value);else{const prior=fixed.get(p);values.set(p,prior.value);dependencies.push(prior);}}if(shared.exactRow(row,values,math,tick)){fixed.set(parameter,{param:parameter,value,row,dependencies});changed=true;}}}}
 const next=(polynomials:Polynomial[],eliminated:Map<any,number>,substituted:Map<any,Polynomial>,approximate:Set<any>)=>{
  // Aliases/fixed reduction leaves are proposals ONLY. The unique original
  // linear-row DAG must prove each Number by exact dyadic substitution.
  const proposal=shared.proposalResolver(eliminated,substituted,approximate,math,tick);
  if(!targets.some(t=>{tick();return !t.done&&t.binding.params.every(p=>proposal(p)!==null);}))return null;
  certify(proposal);
  for(const target of targets){tick();if(target.done||!target.binding.params.every(p=>fixed.has(p)&&proposal(p)!==null&&Object.is(fixed.get(p).value,proposal(p))))continue;
   const c=target.binding.constraint,proofs=target.binding.params.map(p=>fixed.get(p)),values=new Map<any,number>(proofs.map(p=>[p.param,p.value]));
   // Sufficient domain: actual native inputs already agree with their proved
   // values. Never set a coordinate, invent a domain proxy or copy a solve.
   if(!targetOwned(c)||proofs.some(p=>!Object.is(p.param.get(),p.value)))continue;
   try{assertRegisteredConstraintDomain(c);}catch(error){if(error?.code==='RESOURCE_LIMIT')throw error;continue;}
   const value=exactValue(target.original,values);if(!value||value.n)continue;
   const own=polynomials.filter(p=>{tick();return p&&system.polyToConstr.get(p)===c;});if(target.retained?own.length!==0:own.length!==1)continue;const originalRows=[];c.collectPolynomials(originalRows);if(originalRows.length!==1||!samePolynomial(target.original,snapshot(originalRows[0],c.params)))continue;
   const verify=(pass?:object)=>{
    // The existing validator supplies its private per-pass Map. Budget resets
    // once per real pass and aggregates every witness, not across later drags.
    if(pass!==validationPass||!pass){work=0;validationPass=pass||{};}
    const exact=arithmetic(tick),active=new Set(system.allConstraints);for(const _ of active)tick();
    if(system.expressionResolver!==resolver||!shared.sameBinding(target.binding,system,active)||!targetOwned(c)||proofs.some(p=>!Object.is(p.param.get(),p.value)))stop('Exact tangent source, definitions or owned fixed inputs changed.');
    const pending=[...proofs],seen=new Set<any>();while(pending.length){tick();const proof=pending.pop();if(seen.has(proof))continue;seen.add(proof);const row=proof.row,b=row.binding;
     if(b.constraint===c||!shared.sameBinding(b,system,active)||!supportOwned(b.constraint)||!Object.is(proof.param.get(),proof.value))stop('An original tangent fixed-input witness changed.');
     // Re-resolve the same captured bindings and compare ORIGINAL coefficients
     // and constants, in addition to exact raw literal/name/source identity.
     b.constraint.resolveConstants(resolver);const original=[];b.constraint.collectPolynomials(original);const actual=original[row.index]&&shared.linearRow(b,row.index,original[row.index],exact,tick);
     if(!actual||!exact.equal(actual.constant,row.constant)||actual.coefficients.size!==row.coefficients.size||[...actual.coefficients].some(([p,v])=>!row.coefficients.has(p)||!exact.equal(v,row.coefficients.get(p))))stop('An original tangent fixed-input equation or binding changed.');
     const bindingValues=new Map<any,number>([[proof.param,proof.value]]);for(const dependency of proof.dependencies){tick();bindingValues.set(dependency.param,dependency.value);pending.push(dependency);}if(!shared.exactRow(actual,bindingValues,exact,tick))stop('An original tangent fixed-input equation is not exactly satisfied.');
     domain(b.constraint);
    }
    c.resolveConstants(resolver);const original=[];c.collectPolynomials(original);const actual=original.length===1?snapshot(original[0],c.params):null;if(!samePolynomial(target.original,actual))stop('Original tangent squared equation changed.');const actualExact=exactValue(actual,values,exact,tick);if(!actualExact||actualExact.n)stop('Original tangent squared equation is not exactly zero.');domain(c);
    const numeric=original.map(p=>p.value()),profile=registeredResidualProfile(c,numeric);if(numeric.some(v=>!Number.isFinite(v))||profile.residuals.some(v=>!Number.isFinite(v)))throw withAdmissionCause(Error('Nonfinite original tangent residual after the fixed-input proof.'),admissionCause('nonfinite-result'));if(profile.residuals.some((v,i)=>Math.abs(v)>profile.tolerances[i]))throw withAdmissionCause(Object.assign(Error('Original tangent residual failed after the fixed-input proof.'),{code:'RESIDUAL'}),admissionCause('original-residual-failure'));
   };
   return{constraint:c,retained:target.retained,rows:originalRows,verify,apply(){if(target.done)stop('The exact tangent fixed-input plan was already consumed.');target.done=true;for(let i=0;i<polynomials.length;i++)if(own.includes(polynomials[i]))polynomials[i]=null;}};
  }return null;
 };
 return{capture,next};
}
