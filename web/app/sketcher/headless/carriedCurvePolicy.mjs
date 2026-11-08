import {captureBezierRecord} from '../shapes/cubicCurveRecord.mjs';
import {captureEllipseRecordData} from '../shapes/ellipseRecord.mjs';
// Bounded preflight for the serialized curve forms already read by sketch IO.
const record=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const exact=(v,keys)=>record(v)&&Object.keys(v).sort().join(',')===[...keys].sort().join(',');
const point=v=>exact(v,['x','y'])&&[v.x,v.y].every(Number.isFinite);
const bad=()=>{throw Error('Invalid or degenerate carried sketch curve.');};
export function inspectCarriedCurve(type,data){
 if(type==='BezierCurve'){
  captureBezierRecord(data);
  return [[':1','Segment'],[':1:A','Point'],[':1:B','Point'],[':2','Segment'],[':2:A','Point'],[':2:B','Point']];
 }
 if(type!=='Ellipse'&&type!=='EllipticalArc')throw Error('Unknown carried curve type.');
 // Ordinary Ellipse shares the native Open domain; EllipticalArc keeps its
 // existing separate endpoint/curve policy unchanged.
 if(type==='Ellipse'){captureEllipseRecordData(data);return [[':C','Point']];}
 const arc=type==='EllipticalArc',ends=arc?['a','b']:[];let cx,cy,rx,ry,rot;
 if(Object.hasOwn(data||{},'ep1')){
  if(!exact(data,['ep1','ep2','r',...ends])||!point(data.ep1)||!point(data.ep2))bad();
  cx=data.ep1.x+(data.ep2.x-data.ep1.x)/2;cy=data.ep1.y+(data.ep2.y-data.ep1.y)/2;
  rx=Math.hypot(data.ep2.x-data.ep1.x,data.ep2.y-data.ep1.y)/2;ry=data.r;rot=Math.atan2(data.ep2.y-data.ep1.y,data.ep2.x-data.ep1.x);
 }else{
  if(!exact(data,['c','rx','ry','rot',...ends])||!point(data.c))bad();
  ({x:cx,y:cy}=data.c);({rx,ry,rot}=data);
 }
 if(![cx,cy,rx,ry,rot].every(Number.isFinite)||rx<=1e-9||ry<=1e-9)bad();
 if(arc)for(const key of ends){if(!point(data[key]))bad();const dx=data[key].x-cx,dy=data[key].y-cy,x=(dx*Math.cos(rot)+dy*Math.sin(rot))/rx,y=(-dx*Math.sin(rot)+dy*Math.cos(rot))/ry;
  // Distance to the ellipse along this normalized radial direction, in mm.
  if(Math.abs(Math.hypot(x,y)-1)*Math.max(rx,ry)>1e-6)bad();
 }
 return [[':C','Point'],...(arc?[[':A','Point'],[':B','Point']]:[])];
}
