import {PHYSICAL_COORDINATE_RECONSTRUCTION_BUDGET_MM,isPhysicalSketchCoordinate} from './physicalCoordinateReconstruction.mjs';
import {inspectBoundedSpline,splineSourceError} from './splinePolicy.mjs';
import {admissionCause,withAdmissionCause,failureCause} from '../constr/admissionCause.mjs';
import {BSpline} from '../shapes/b-spline';
import {Generator} from '../id-generator';
// Worker-only actual rebuild. Unknown native inability is unavailable proof,
// never automatically a mathematical domain failure or an infeasibility proof.
export function validateSplineDerivedGeometry(id:string,data:any):void {
 inspectBoundedSpline(id,data);
 Generator.withReservedIds(0,()=>{
  let actual:any;
  try{const curve:any=BSpline.read(id,structuredClone(data));if(curve.bSplineInterpolation.interpolation){curve.bSplineInterpolation.cPoints=curve.cPoints;curve.update(curve.type,curve.method);}else if(curve.bSplineControlVertices.CVModel)curve.cvUpdate(curve.type,curve.method);actual=curve.write();}
  catch(error){if(failureCause(error)||['SPLINE_RESOURCE_LIMIT','UNSUPPORTED_SPLINE_SOURCE','SPLINE_DOMAIN','INVALID_SPLINE_DATA','NONFINITE_RESULT'].includes(error?.code))throw error;throw splineSourceError('UNSUPPORTED_SPLINE_SOURCE','Actual bounded native spline rebuild could not establish a source proof.');}
  const mismatch=()=>{throw withAdmissionCause(splineSourceError('SPLINE_DERIVED_MISMATCH','Saved spline data differs from its actual bounded native rebuild.'),admissionCause('retained-validation-failure'));};
  const todo:any[]=[[data,actual,[]]];let count=0;
  while(todo.length){const [a,b,path]=todo.pop();if(++count>8192)throw withAdmissionCause(splineSourceError('SPLINE_RESOURCE_LIMIT','Spline validation exceeds its existing work limit.'),admissionCause('resource-limit'));
   if(typeof a==='number'||typeof b==='number'){
    if(typeof b!=='number'||!Number.isFinite(b))throw withAdmissionCause(splineSourceError('NONFINITE_RESULT','Actual native spline rebuild produced a nonfinite numeric field.'),admissionCause('nonfinite-result'));
    if(typeof a!=='number'||!Number.isFinite(a))throw withAdmissionCause(splineSourceError('INVALID_SPLINE_DATA','Saved spline contains an invalid numeric field.'),admissionCause('invalid-domain'));
    if(Math.abs(a-b)>(isPhysicalSketchCoordinate('BSpline',path)?PHYSICAL_COORDINATE_RECONSTRUCTION_BUDGET_MM:1e-9))mismatch();continue;
   }
   if(a===null||b===null||typeof a!=='object'||typeof b!=='object'){if(a!==b)mismatch();continue;}
   if(Array.isArray(a)!==Array.isArray(b))mismatch();const ak=Object.keys(a).sort(),bk=Object.keys(b).sort();if(ak.length!==bk.length||ak.some((key,i)=>key!==bk[i]))mismatch();for(const key of ak)todo.push([a[key],b[key],[...path,key]]);
  }
 });
}
