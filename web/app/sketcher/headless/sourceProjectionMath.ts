import {createFiniteCurveCertificateArithmetic} from '../../../../modules/engine/mount/finiteCurveCertificateArithmetic.mjs';
import {PHYSICAL_COORDINATE_RECONSTRUCTION_BUDGET_MM as BUDGET} from './physicalCoordinateReconstruction.mjs';
import {projectionFail as fail} from 'engine/source/sourceProjectionIntent.mjs';
// Actual represented source/frame only. Exact arithmetic certifies rounding and
// Circle preservation; it never supplies source ownership or edits a source.
export function createSourceProjectionMath(frame:any){
 const a=createFiniteCurveCertificateArithmetic(),n=a.number,add=a.add,mul=a.mul,sub=a.sub,abs=a.abs,one=a.integer(1),budget=n(BUDGET);
 const dot=(u:any[],v:any[])=>add(mul(n(u[0]),n(v[0])),mul(n(u[1]),n(v[1])));
 function point(raw:any){
  if(!raw||![raw.x,raw.y].every(v=>typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<=1e8))fail('PROJECTION_COORDINATE_UNQUALIFIED','Source coordinates exceed the projection domain.');
  const out:any={},errors:any[]=[];
  for(let i=0;i<2;i++){
   const value=frame.origin[i]+frame.x[i]*raw.x+frame.y[i]*raw.y;
   if(!Number.isFinite(value)||Math.abs(value)>1e8)fail('PROJECTION_COORDINATE_UNQUALIFIED','Projected coordinates exceed the existing source domain.');
   const exact=add(add(n(frame.origin[i]),mul(n(frame.x[i]),n(raw.x))),mul(n(frame.y[i]),n(raw.y))),error=abs(sub(n(value),exact));
   if(a.cmp(error,budget)>0)fail('PROJECTION_COORDINATE_UNQUALIFIED','Represented XY projection exceeds the50pm coordinate budget.');
   out[i===0?'x':'y']=value;errors.push(error);
  }
  const l1=add(errors[0],errors[1]);if(a.cmp(l1,budget)>0)fail('PROJECTION_COORDINATE_UNQUALIFIED','Represented XY projection does not prove Euclidean displacement within50pm.');
  return{point:Object.freeze(out),errors,l1};
 }
 function segment(raw:any,id:string){const p=point(raw.a),q=point(raw.b);if(Math.hypot(q.point.x-p.point.x,q.point.y-p.point.y)<=1e-9)fail('PROJECTION_COLLAPSED_SEGMENT','The actual projected Segment is collapsed or below its existing entity domain.');return Object.freeze({id,a:p.point,b:q.point});}
 function circle(raw:any,id:string){
  if(!Number.isFinite(raw.r)||raw.r<=1e-9||raw.r>1e8)fail('PROJECTION_COORDINATE_UNQUALIFIED','Circle radius exceeds the existing source domain.');
  if(frame.x[2]!==0||frame.y[2]!==0)fail('PROJECTION_CIRCLE_FRAME_UNQUALIFIED','A tilted source Circle projects to an ellipse; no Circle substitute is admitted.');
  const center=point(raw.c),u=frame.x,v=frame.y;
  // ||M^T M-I||op <= entrywise L1 delta. For delta<1, each singular
  // value differs from1 by <=delta. Thus r*delta bounds Circle radial error
  // for EVERY parameter, not sampled points or a rounded norm assertion.
  const delta=add(add(abs(sub(dot(u,u),one)),abs(sub(dot(v,v),one))),mul(a.integer(2),abs(dot(u,v)))),radial=mul(n(raw.r),delta);
  if(a.cmp(delta,one)>=0||a.cmp(add(center.l1,radial),budget)>0)fail('PROJECTION_CIRCLE_FRAME_UNQUALIFIED','Actual in-plane frame and radius do not prove Circle preservation within50pm.');
  return Object.freeze({id,c:center.point,r:raw.r});
 }
 return Object.freeze({segment,circle,get chargedWork(){return a.work;}});
}
