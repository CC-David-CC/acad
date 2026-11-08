import {PHYSICAL_COORDINATE_RECONSTRUCTION_BUDGET_MM,isPhysicalSketchCoordinate} from './physicalCoordinateReconstruction.mjs';
// Preserve the old import name; the actual policy is now explicitly physical.
export const CURRENT_DIAGNOSTIC_POSITION_TOLERANCE_MM=PHYSICAL_COORDINATE_RECONSTRUCTION_BUDGET_MM;
// Retained old comparator for mixed numeric leaves (angles/radii/knots/etc.).
// It is not the new physical coordinate budget or a new dimensional policy.
const RETAINED_OTHER_NUMERIC_TOLERANCE=1e-9;
export function assertCurrentDiagnosticGeometry(before,after){
 const fail=()=>{const e=new Error('The solved sketch differs from the current sketch.');e.code='CURRENT_GEOMETRY_MISMATCH';throw e;};
 if(!before||!after||!Array.isArray(before.objects)||!Array.isArray(after.objects)||before.objects.length!==after.objects.length||before.objects.length>10000)fail();
 const intent=x=>JSON.stringify({version:x.version,stages:x.stages,dimensions:x.dimensions,labels:x.labels,constants:x.constants,metadata:x.metadata,boundary:x.boundary,objects:x.objects.map(o=>({id:o.id,type:o.type,role:o.role,stage:o.stage}))});
 if(intent(before)!==intent(after))fail();let visited=0;const todo=before.objects.map((o,i)=>[o.data,after.objects[i].data,o.type,[]]);
 while(todo.length){const [a,b,type,path]=todo.pop();if(++visited>100000)fail();if(typeof a==='number'||typeof b==='number'){const budget=isPhysicalSketchCoordinate(type,path)?PHYSICAL_COORDINATE_RECONSTRUCTION_BUDGET_MM:RETAINED_OTHER_NUMERIC_TOLERANCE;if(typeof a!=='number'||typeof b!=='number'||!Number.isFinite(a)||!Number.isFinite(b)||Math.abs(a-b)>budget)fail();continue;}if(a===null||b===null||typeof a!=='object'||typeof b!=='object'){if(a!==b)fail();continue;}if(Array.isArray(a)!==Array.isArray(b))fail();const ak=Object.keys(a).sort(),bk=Object.keys(b).sort();if(ak.length!==bk.length||ak.some((k,i)=>k!==bk[i]))fail();for(const k of ak)todo.push([a[k],b[k],type,[...path,k]]);}
 return true;
}
