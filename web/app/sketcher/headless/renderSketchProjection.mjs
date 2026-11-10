import {arcBranchFacts} from '../shapes/arcBranch.mjs';
// Worker-only projection of already validated native data. No live IDs or solver state.
import {BSpline, BSplinePolynomial} from '../shapes/b-spline.ts';
import {inspectBoundedSpline} from './splinePolicy.mjs';
const MAX_NODES=100000, MAX_CHARS=1048576, MAX_DEPTH=64, MAX_OBJECTS=10000;
const SPLINE_TOLERANCE=0.01, SPLINE_MAX_POINTS=4096, SPLINE_TOTAL_POINTS=8192, SPLINE_TOTAL_WORK=250000, SPLINE_MAX_DEPTH=24;
const fail=()=>{throw Error('Invalid or oversized render projection source.')};
function detached(value){
 const ancestors=new Set();let nodes=0,chars=0;
 function copy(item,depth){
  if(++nodes>MAX_NODES||depth>MAX_DEPTH)fail();
  if(typeof item==='string'){chars+=item.length;if(chars>MAX_CHARS)fail();return item}
  if(item===null||typeof item==='boolean'||typeof item==='number'&&Number.isFinite(item))return item;
  if(!item||typeof item!=='object'||ancestors.has(item))fail();
  const array=Array.isArray(item),proto=Object.getPrototypeOf(item);
  if(array?proto!==Array.prototype:proto!==Object.prototype&&proto!==null)fail();
  const keys=Reflect.ownKeys(item);if(array&&(keys.length!==item.length+1||keys[keys.length-1]!=='length'))fail();
  if(keys.length+nodes>MAX_NODES+(array?1:0))fail();const result=array?[]:Object.create(null);ancestors.add(item);
  try{for(let i=0;i<keys.length;i++){const key=keys[i];if(typeof key!=='string')fail();if(array&&key==='length')continue;if(array&&key!==String(i))fail();const d=Object.getOwnPropertyDescriptor(item,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail();chars+=key.length;if(chars>MAX_CHARS)fail();Object.defineProperty(result,key,{value:copy(d.value,depth+1),enumerable:true})}}finally{ancestors.delete(item)}
  return Object.freeze(result);
 }
 return copy(value,0);
}
const point=p=>p&&typeof p==='object'&&Number.isFinite(p.x)&&Number.isFinite(p.y)?Object.freeze({x:p.x,y:p.y}):null;
const full=(a,b)=>Math.abs(a.x-b.x)<1e-6&&Math.abs(a.y-b.y)<1e-6;
const positive=n=>typeof n==='number'&&Number.isFinite(n)&&n>0;
const handle=(id,p)=>Object.freeze({id,x:p.x,y:p.y});
const angle=(p,c)=>Math.atan2(p.y-c.y,p.x-c.x);
function ellipseAngle(p,c,rx,ry,rot){const x=p.x-c.x,y=p.y-c.y,co=Math.cos(rot),si=Math.sin(rot);return Math.atan2(-x*si+y*co,(x*co+y*si)*ry/rx)}
function projectSpline(row,budget){
 const d=row.data;
 try {inspectBoundedSpline(row.id,d)} catch {return {unsupportedReason:'spline-data-unsupported'}}
 for(let i=d.degree;i<d.cPoints.length;i++){const gap=d.kValues[i+1]-d.kValues[i];if(gap>0&&gap<=1e-12)return {unsupportedReason:'spline-knot-spacing-unsupported'}}
 const estimate=d.cPoints.length*(d.degree+1)**2;
 if(budget.points>=SPLINE_TOTAL_POINTS||budget.work+estimate>SPLINE_TOTAL_WORK)return {unsupportedReason:'spline-tessellation-limit'};
 budget.work+=estimate;
 // Existing methods operate on this private receiver; no Shape constructor,
 // viewer, PM, global IDs or solver state is created.
 const curve=Object.create(BSpline.prototype);
 curve.degree=d.degree;curve.cPoints=d.cPoints;curve.kValues=d.kValues;curve.numberOfControlPoints=d.cPoints.length;
 curve.bSplinePolynomial=new BSplinePolynomial(d.kValues,d.degree+1);
 let segments;try{segments=curve.bsplineToBezierSegments_full()}catch{return {unsupportedReason:'spline-conversion-failed'}}
 if(!Array.isArray(segments)||!segments.length||segments.length>64||segments[0].u0!==d.kValues[d.degree]||segments[segments.length-1].u1!==d.kValues[d.cPoints.length]||segments.some((s,i)=>i>0&&s.u0!==segments[i-1].u1))return {unsupportedReason:'spline-conversion-failed'};
 const out=[];let work=0;
 const add=p=>{if(!Number.isFinite(p.x)||!Number.isFinite(p.y)||out.length>=SPLINE_MAX_POINTS||budget.points>=SPLINE_TOTAL_POINTS)throw Error('limit');out.push(Object.freeze({x:p.x,y:p.y}));budget.points++};
 const distance=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,den=dx*dx+dy*dy;if(!Number.isFinite(den))throw Error('limit');const t=den===0?0:Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/den)),result=Math.hypot(p.x-(a.x+t*dx),p.y-(a.y+t*dy));if(!Number.isFinite(result))throw Error('limit');return result};
 const split=pts=>{const left=[pts[0]],right=[pts[pts.length-1]];let level=pts;while(level.length>1){const next=[];for(let i=1;i<level.length;i++)next.push({x:(level[i-1].x+level[i].x)/2,y:(level[i-1].y+level[i].y)/2});left.push(next[0]);right.push(next[next.length-1]);level=next}return [left,right.reverse()]};
 try{
  for(const segment of segments){const cps=segment.cps;if(!Array.isArray(cps)||cps.length!==d.degree+1||!Number.isFinite(segment.u0)||!Number.isFinite(segment.u1)||segment.u0>=segment.u1||cps.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))throw Error('conversion');
   // Compare the converted polynomial with the actual basis evaluator at
   // degree+1 interior points; this is not a solver or manufacturing verdict.
   for(let j=1;j<=d.degree+1;j++){const t=j/(d.degree+2),u=segment.u0+(segment.u1-segment.u0)*t,expected=curve.getPoint(u);let q=cps.map(p=>({x:p.x,y:p.y}));while(q.length>1)q=q.slice(1).map((p,i)=>({x:(1-t)*q[i].x+t*p.x,y:(1-t)*q[i].y+t*p.y}));if(!Number.isFinite(expected.x)||!Number.isFinite(expected.y)||!Number.isFinite(q[0].x)||!Number.isFinite(q[0].y)||Math.hypot(q[0].x-expected.x,q[0].y-expected.y)>1e-6)throw Error('conversion')}
   const first=cps[0];if(!out.length)add(first);else if(distance(first,out[out.length-1],out[out.length-1])>1e-7)throw Error('discontinuous');
   const stack=[{points:cps,depth:0}];while(stack.length){if(++work>16384||++budget.work>SPLINE_TOTAL_WORK)throw Error('limit');const {points,depth}=stack.pop(),a=points[0],b=points[points.length-1];let flat=true;for(const p of points)if(distance(p,a,b)>SPLINE_TOLERANCE){flat=false;break}if(flat)add(b);else{if(depth>=SPLINE_MAX_DEPTH)throw Error('limit');const [left,right]=split(points);stack.push({points:right,depth:depth+1},{points:left,depth:depth+1})}}
  }
  return {geometry:{kind:'polyline',points:Object.freeze(out),approximation:'bounded-bezier-chord-v1',tolerance:SPLINE_TOLERANCE},handles:[]};
 }catch(error){budget.points-=out.length;return {unsupportedReason:error?.message==='limit'?'spline-tessellation-limit':'spline-conversion-failed'}}
}
function geometryFor(row,budget){
 const d=row.data,id=row.id;if(!d||typeof d!=='object'||Array.isArray(d))return null;
 const a=point(d.a),b=point(d.b),c=point(d.c);
 if(row.type==='Point'){const p=point(d);return p&&{geometry:{kind:'point',...p},handles:[handle(id,p)]}}
 if(row.type==='Segment'&&a&&b)return {geometry:{kind:'segment',a,b},handles:[handle(id+':A',a),handle(id+':B',b)]};
 if(row.type==='Circle'&&c&&positive(d.r))return {geometry:{kind:'circle',c,r:d.r},handles:[handle(id+':C',c)]};
 if(row.type==='Arc'&&a&&b&&c){const r=Math.hypot(a.x-c.x,a.y-c.y),endRadius=Math.hypot(b.x-c.x,b.y-c.y);if(!positive(r)||!Number.isFinite(endRadius))return null;const f=arcBranchFacts({a,b,c,branch:d.branch});if(!f.representable)return {unsupportedReason:'arc-interval-unrepresentable'};return {geometry:{kind:'arc',c,r,start:f.branch==='full-ccw'?0:f.start,end:f.branch==='full-ccw'?2*Math.PI:f.end,fullCircle:f.branch==='full-ccw',endPoint:b,endRadius},handles:[handle(id+':A',a),handle(id+':B',b),handle(id+':C',c)]}}
 if((row.type==='Ellipse'||row.type==='EllipticalArc')&&c&&positive(d.rx)&&positive(d.ry)&&Number.isFinite(d.rot)){// Semantic Ellipse parameters are never display-clamped. Keep the existing
 // EllipticalArc projection policy separate from this ordinary ellipse slice.
 const base={c,rx:row.type==='Ellipse'?d.rx:Math.max(d.rx,1e-8),ry:row.type==='Ellipse'?d.ry:Math.max(d.ry,1e-8),rotation:d.rot};if(row.type==='Ellipse')return {geometry:{kind:'ellipse',...base},handles:[handle(id+':C',c)]};if(!a||!b)return null;const start=ellipseAngle(a,c,d.rx,d.ry,d.rot),isFull=full(a,b),end=isFull?start+2*Math.PI:ellipseAngle(b,c,d.rx,d.ry,d.rot);if(!Number.isFinite(start)||!Number.isFinite(end))return null;return {geometry:{kind:'ellipticalArc',...base,start,end,fullCircle:isFull},handles:[handle(id+':A',a),handle(id+':B',b),handle(id+':C',c)]}}
 if(row.type==='BezierCurve'){const p0=point(d.cp1),p1=point(d.cp2),p2=point(d.cp3),p3=point(d.cp4);if(!p0||!p1||!p2||!p3)return null;return {geometry:{kind:'cubic',p0,p1,p2,p3},handles:[handle(id+':1:A',p0),handle(id+':1:B',p1),handle(id+':2:B',p2),handle(id+':2:A',p3)]}}
 if(row.type==='BSpline')return projectSpline(row,budget);
 return null;
}
function extendBounds(bounds,geometry){
 const add=(x,y)=>{if(!Number.isFinite(x)||!Number.isFinite(y))fail();bounds.minX=Math.min(bounds.minX,x);bounds.minY=Math.min(bounds.minY,y);bounds.maxX=Math.max(bounds.maxX,x);bounds.maxY=Math.max(bounds.maxY,y)};
 const g=geometry;
 if(g.kind==='point')add(g.x,g.y);
 else if(g.kind==='segment'){add(g.a.x,g.a.y);add(g.b.x,g.b.y)}
 else if(g.kind==='cubic'){for(const p of [g.p0,g.p1,g.p2,g.p3])add(p.x,p.y)}
 else if(g.kind==='polyline'){for(const p of g.points){add(p.x-g.tolerance,p.y-g.tolerance);add(p.x+g.tolerance,p.y+g.tolerance)}}
 else {const r=g.kind==='circle'||g.kind==='arc'?g.r:g.rx+g.ry;add(g.c.x-r,g.c.y-r);add(g.c.x+r,g.c.y+r);if(g.endPoint)add(g.endPoint.x,g.endPoint.y)}
}
export function projectRenderSketch(acceptedSketch){
 const source=detached(acceptedSketch);
 if(source?.version!==3||!Array.isArray(source.objects)||source.objects.length>MAX_OBJECTS||!Array.isArray(source.stages)||!source.stages.length||source.stages.length>32||!Array.isArray(source.dimensions)||!Array.isArray(source.labels))fail();
 const seen=new Set(),objects=[],unsupported=[],unrendered=[],extent={minX:Infinity,minY:Infinity,maxX:-Infinity,maxY:-Infinity},budget={points:0,work:0};
 for(let stage=0;stage<source.stages.length;stage++){const s=source.stages[stage];if(!s||!Array.isArray(s.constraints)||!Array.isArray(s.generators))fail();if(s.constraints.length)unrendered.push(Object.freeze({kind:'constraint-annotations',stage,count:s.constraints.length}));for(let index=0;index<s.generators.length;index++)unrendered.push(Object.freeze({kind:'generator',stage,index}))}
 for(const kind of ['dimensions','labels'])if(source[kind].length)unrendered.push(Object.freeze({kind,count:source[kind].length}));
 if(source.boundary&&typeof source.boundary==='object'){let count=0;for(const key of ['lines','arcs','circles','nurbses']){if(!Array.isArray(source.boundary[key]))fail();count+=source.boundary[key].length}if(count)unrendered.push(Object.freeze({kind:'boundary',count}))}
 for(const row of source.objects){if(!row||typeof row.id!=='string'||!row.id||row.id.length>1024||seen.has(row.id)||typeof row.type!=='string'||!Number.isSafeInteger(row.stage)||row.stage<0||row.stage>=source.stages.length||!(row.role===null||typeof row.role==='string'))fail();seen.add(row.id);const p=geometryFor(row,budget);if(!p?.geometry)unsupported.push(Object.freeze({id:row.id,type:row.type,reason:p?.unsupportedReason||'geometry-not-projected'}));else extendBounds(extent,p.geometry);objects.push(Object.freeze({id:row.id,type:row.type,role:row.role,stage:row.stage,geometry:p?.geometry?Object.freeze(p.geometry):null,handles:Object.freeze(p?.geometry?p.handles:[])}))}
 const bounds=Number.isFinite(extent.minX)?Object.freeze({...extent,kind:'conservative-projected-geometry',complete:unsupported.length===0&&!unrendered.some(x=>x.kind==='generator'||x.kind==='boundary')}):null;
 return Object.freeze({version:1,source,objects:Object.freeze(objects),unsupported:Object.freeze(unsupported),unrendered:Object.freeze(unrendered),bounds,capabilities:Object.freeze({geometry:'partial',selection:'geometry-and-declared-handles',constraints:'source-only',generators:'source-only',dimensions:'source-only',labels:'source-only',boundary:'source-only',solver:'unavailable'})});
}
