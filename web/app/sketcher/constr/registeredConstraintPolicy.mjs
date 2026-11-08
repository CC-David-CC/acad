import {assertSlotBranch} from './straightSlotRecord.mjs';
// Explicit domains and dimensional residual profiles for registered UI schemas.
import {projectedDirectionValid} from './projectedDistanceDomain.mjs';
const LENGTH=1e-6,ANGLE=1e-8;
// Explicit existing source-schema scope: deferred admission must not infer
// millimeter units for arbitrary schemas from the historical default below.
const registeredSchemas=new Set(['StraightSlot','PCoincident','LockPoint','Horizontal','Vertical','SegmentLength','EqualLength','LengthRelation','RadiusLength','DiameterLength','DistancePL','PointOnLine','SignedDistanceX','SignedDistanceY','ProjectedDistance','Collinear','AxisSymmetry','Concentric','EqualRadius','Angle','AngleBetween','Parallel','Perpendicular','DistancePP','PointInMiddle','Symmetry','TangentLC','PointOnCircle','PointOnBezier','TangentLineBezier','PointOnEllipse','Polar','ArcConsistency','Fillet','FixSegment','FixCircle','FixArc','RigidGroup']);
export const hasRegisteredResidualPolicy=c=>!!c&&registeredSchemas.has(c.schema?.id);
const angleSchemas=new Set(['Angle','AngleBetween','Parallel','Perpendicular','Horizontal','Vertical']);
const fail=()=>{throw Error('A sketch constraint has a degenerate or invalid domain.');};
const circle=o=>o?.c&&Number.isFinite(o.r?.get())&&o.r.get()>1e-9;
export function assertRegisteredConstraintDomain(c){
 const id=c.schema.id,o=c.objects;
 if(id==='StraightSlot')assertSlotBranch(o,c.resolvedConstants.radius);
 const lines=id==='Angle'||id==='Horizontal'||id==='Vertical'?[o[0]]:['AngleBetween','Parallel','Perpendicular'].includes(id)?o:['TangentLC','TangentLineBezier'].includes(id)?[o[0]]:id==='Fillet'?o.slice(0,2):[];
 if(lines.some(line=>!projectedDirectionValid(line)))fail();
 const circular=['RadiusLength','DiameterLength'].includes(id)?[o[0]]:['Concentric','EqualRadius'].includes(id)?o:id==='PointOnCircle'?[o[1]]:id==='TangentLC'?[o[1]]:id==='Fillet'?[o[2]]:[];
 if(circular.some(x=>!circle(x)))fail();
 if(id==='PointOnEllipse'){
  const e=o[1];if(!e?.c||![e.rx?.get(),e.ry?.get(),e.rot?.get()].every(Number.isFinite)||e.rx.get()<=1e-9||e.ry.get()<=1e-9)fail();
 }
 if(id==='PointOnBezier'||id==='TangentLineBezier'){
  const t=c.params[8]?.get();if(!Number.isFinite(t)||t < -1e-9||t > 1+1e-9)fail();
  if(id==='TangentLineBezier'){
   const b=o[1],v=1-t,dx=3*(v*v*(b.cp1.x-b.a.x)+2*v*t*(b.cp2.x-b.cp1.x)+t*t*(b.b.x-b.cp2.x)),dy=3*(v*v*(b.cp1.y-b.a.y)+2*v*t*(b.cp2.y-b.cp1.y)+t*t*(b.b.y-b.cp2.y));
   if(![dx,dy].every(Number.isFinite)||Math.hypot(dx,dy)<=1e-9||Math.hypot(c.params[11]?.get(),c.params[12]?.get())<=1e-9)fail();
  }
 }
}
export function registeredResidualProfile(c,polynomialValues){
 let residuals=[...polynomialValues];const units=residuals.map(()=>angleSchemas.has(c.schema.id)?'radian':'millimeter');
 if(c.schema.id==='DistancePP'||c.schema.id==='PointOnCircle'){
  const [a,b]=c.objects,p=c.schema.id==='DistancePP'?b:b.c,r=c.schema.id==='DistancePP'?Math.abs(c.resolvedConstants.distance):b.r.get(),scale=Math.hypot(a.x-p.x,a.y-p.y)+r;
  // Squared-distance equations become radial/point distance errors in mm.
  residuals=residuals.map(v=>scale>0?v/scale:v===0?0:Infinity);
 }
 if(c.schema.id==='PointInMiddle'||c.schema.id==='Symmetry')residuals=residuals.map(v=>v/2);
 if(c.schema.id==='TangentLineBezier'){
  const at=residuals.length-2,scale=Math.hypot(c.params[11].get(),c.params[12].get());residuals[at]/=scale;units[at]='radian';
 }
 const tolerances=units.map(u=>u==='radian'?ANGLE:LENGTH),mixed=new Set(units).size>1;
 return {residuals,tolerances,units,tolerance:mixed?null:(tolerances[0]??LENGTH),unit:mixed?'mixed':(units[0]??'millimeter')};
}
