import {BezierCurve} from '../shapes/bezier-curve';
import {BSpline,GeneralKnotsCalculator} from '../shapes/b-spline';
import {EndPoint} from '../shapes/point';
import {inspectBoundedSpline} from './splinePolicy.mjs';
import {captureCubicCreation,captureSplineIdentities} from '../shapes/cubicCurveRecord.mjs';
export function constructNativeCubic(kind:string,data:any,id:string,rawIdentities?:any){
 const d:any=captureCubicCreation(kind,data);
 if(kind==='BezierCurve')return new BezierCurve(d.cp1.x,d.cp1.y,d.cp2.x,d.cp2.y,d.cp3.x,d.cp3.y,d.cp4.x,d.cp4.y,id);
 const identities=captureSplineIdentities(rawIdentities,d.controlPoints.length),controls=d.controlPoints.map((p,i)=>new EndPoint(p.x,p.y,identities.controls[i]));
 const knots=new GeneralKnotsCalculator().calculate(controls.slice(1,-1),3,'Clamped',0);
 // Bound the native constructor's sampling BEFORE invoking it. This is not
 // geometric ownership evidence; actual factory/derived/cold proofs follow.
 inspectBoundedSpline(id,{degree:3,cPoints:controls.map(p=>({id:p.id,x:p.x,y:p.y})),fPoints:[],kValues:knots,interpolation:false,CVModel:true,type:'Clamped',method:0});
 const curve=new BSpline({degree:3,cPoints:controls,fPoints:[],kValues:knots,interpolation:false,CVModel:true,type:'Clamped',method:0},id);
 curve.cvUpdate('Clamped',0);
 if(curve.fPoints.length!==identities.derived.length)throw Object.assign(Error('Actual native derived-point membership changed.'),{code:'IDENTITY_MISMATCH'});
 // Real EndPoints carry ACTUAL native evaluated data and captured private IDs.
 // Derived points grant no public control mutation authority.
 curve.resetFPoints(curve.fPoints.map((p,i)=>new EndPoint(p.x,p.y,identities.derived[i])),false);
 return curve;
}
