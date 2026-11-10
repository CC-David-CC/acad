// Worker-only bounded proof against exact arithmetic on the ORIGINAL F64
// frame/source quantities. No rounded local-coordinate input or source rewrite.
import {createFiniteCurveCertificateArithmetic} from './finiteCurveCertificateArithmetic.mjs';
const fail=message=>{throw Object.assign(Error(message),{code:'ANALYTIC_PROFILE_UNQUALIFIED'});};
export function createAnalyticProfileWorldCertificate(frame,depth){
 const A=createFiniteCurveCertificateArithmetic(),B=A.div(A.integer(1),A.integer(20000000)),B2=A.mul(B,B),incidence=A.div(A.integer(1),A.integer(1000000000)),zero=A.integer(0);
 const F=Object.fromEntries(['origin','x','y','z'].map(k=>[k,frame[k].map(A.number)])),D=A.number(depth);
 const exactPoint=(p,upper)=>F.origin.map((v,i)=>A.add(A.add(v,A.add(A.mul(F.x[i],A.number(p[0])),A.mul(F.y[i],A.number(p[1])))),upper?A.mul(F.z[i],D):zero));
 const representedPoint=(p,upper)=>frame.origin.map((v,i)=>v+(frame.x[i]*p[0]+frame.y[i]*p[1])+(upper?frame.z[i]*depth:0));
 function assertPoint(p,upper,actual){
  if(!Array.isArray(actual)||actual.length!==3||actual.some(v=>!Number.isFinite(v)))fail('A world construction coordinate is not finite.');
  const ideal=exactPoint(p,upper),error=actual.map((v,i)=>A.sub(A.number(v),ideal[i])),squared=error.reduce((n,v)=>A.add(n,A.mul(v,v)),zero);
  if(A.cmp(squared,B2)>0)fail('The actual world coordinate cannot retain the 50 pm source-coordinate budget.');
 }
 function assertCircle(curve,upper,circle,range){
  // The constructor deliberately supplies source A as Native parameter zero.
  // A changed/rephased chart needs a separately certified phase transform;
  // never infer it from nearby endpoints or sampled trig values.
  if(range[0]!==0||circle.axis.reduce((n,v,i)=>n+v*frame.z[i],0)<=0)fail('The actual Native circle chart has no certified original-A phase.');
  const center=exactPoint(curve.center,upper),ux=A.sub(A.number(curve.a[0]),A.number(curve.center[0])),uy=A.sub(A.number(curve.a[1]),A.number(curve.center[1])),radius=A.number(circle.radius);
  const squared=F.origin.reduce((sum,_,i)=>{
   const U=A.add(A.mul(F.x[i],ux),A.mul(F.y[i],uy)),V=A.sub(A.mul(F.y[i],ux),A.mul(F.x[i],uy));
   // Uniform all-parameter support bound: |dc|+|dU|+|dV|. The retained
   // endpoint-incidence allowance is included, not added beyond the budget.
   const error=A.add(incidence,A.add(A.abs(A.sub(A.number(circle.center[i]),center[i])),A.add(A.abs(A.sub(A.mul(radius,A.number(circle.x[i])),U)),A.abs(A.sub(A.mul(radius,A.number(circle.y[i])),V)))));
   return A.add(sum,A.mul(error,error));
  },zero);
  if(A.cmp(squared,B2)>0)fail('The actual Native circular support cannot retain the 50 pm original-frame budget.');
 }
 return Object.freeze({representedPoint,assertPoint,assertCircle});
}
export function certifyAnalyticProfileWorldPreparation(frame,depth,curves){
 const proof=createAnalyticProfileWorldCertificate(frame,depth),occupied=new Set(),key=p=>JSON.stringify(p);
 for(const c of curves){
  for(const upper of[false,true])for(const p of[c.a,c.b,...(c.kind==='arc'?[c.center]:[])])proof.assertPoint(p,upper,proof.representedPoint(p,upper));
  const start=c.orientation==='forward'?c.a:c.b,lower=proof.representedPoint(start,false),upper=proof.representedPoint(start,true);
  for(const p of[lower,upper]){const k=key(p);if(occupied.has(k))fail('The actual world transform erases distinct authored junctions or extrusion height.');occupied.add(k);}
  if(c.kind==='arc')for(const upper of[false,true]){
   const center=key(proof.representedPoint(c.center,upper));
   if(center===key(proof.representedPoint(c.a,upper))||center===key(proof.representedPoint(c.b,upper)))fail('The actual world transform erases the authored Arc radius.');
  }
 }
}
