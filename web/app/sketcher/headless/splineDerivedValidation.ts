import {BSpline} from '../shapes/b-spline';
import {Generator} from '../id-generator';
// Independently rebuild rendering-derived data in this disposable Worker.
// Reuse the input's private EndPoints so validation never fabricates new IDs.
// Source is never modified; any mismatch or unsupported mode is a refusal.
export function validateSplineDerivedGeometry(id:string, data:any):void {
 Generator.withReservedIds(0,()=>{
  const curve:any=BSpline.read(id,structuredClone(data));
  if(curve.bSplineInterpolation.interpolation){curve.bSplineInterpolation.cPoints=curve.cPoints;curve.update(curve.type,curve.method)}
  else if(curve.bSplineControlVertices.CVModel)curve.cvUpdate(curve.type,curve.method);
  const actual=curve.write(), todo:any[]=[[data,actual]];let count=0;
  while(todo.length){const [a,b]=todo.pop();if(++count>8192)throw Error('Spline validation exceeds limits.');if(typeof a==='number'||typeof b==='number'){if(typeof a!=='number'||typeof b!=='number'||!Number.isFinite(a)||!Number.isFinite(b)||Math.abs(a-b)>1e-9)throw Error('Spline derived geometry differs.');continue}if(a===null||b===null||typeof a!=='object'||typeof b!=='object'){if(a!==b)throw Error('Spline authored data differs.');continue}if(Array.isArray(a)!==Array.isArray(b))throw Error('Spline authored data differs.');const ak=Object.keys(a).sort(),bk=Object.keys(b).sort();if(ak.length!==bk.length||ak.some((key,i)=>key!==bk[i]))throw Error('Spline authored data differs.');for(const key of ak)todo.push([a[key],b[key]])}
 });
}
