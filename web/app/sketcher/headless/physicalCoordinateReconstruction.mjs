// User-authorized absolute reconstruction displacement, per canonical x/y
// coordinate component.50pm =5e-8mm. This is not accuracy, residual tolerance,
// topology equivalence, a frame epsilon, a domain minimum or an edit permission.
export const PHYSICAL_COORDINATE_RECONSTRUCTION_BUDGET_MM=5e-8;
const xy=key=>key==='x'||key==='y';
const point=(path,keys)=>path.length===2&&keys.includes(path[0])&&xy(path[1]);
// Paths are relative to a validated serialized object's data. Explicit fields
// avoid treating angles, radii, knots, weights, counts or unknown numeric data
// as coordinates merely because they occur in the same diagnostic tree.
export function isPhysicalSketchCoordinate(type,path){
 if(!Array.isArray(path))return false;
 if(type==='Point')return path.length===1&&xy(path[0]);
 if(type==='Segment')return point(path,['a','b']);
 if(type==='Circle')return point(path,['c']);
 if(type==='Arc')return point(path,['a','b','c']);
 if(type==='BezierCurve')return point(path,['cp1','cp2','cp3','cp4']);
 if(type==='Ellipse')return point(path,['c','ep1','ep2']);
 if(type==='EllipticalArc')return point(path,['c','ep1','ep2','a','b']);
 if(type==='BSpline')return path.length===3&&['cPoints','fPoints','closedBasePoints'].includes(path[0])&&typeof path[1]==='string'&&/^(0|[1-9][0-9]*)$/.test(path[1])&&xy(path[2]);
 if(type==='RigidGroup')return point(path,['transform']);
 return false;
}
