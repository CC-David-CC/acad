// Worker-only v3 extension. Authored data/history remains independent of the
// kernel; this is ephemeral solved geometry for one explicitly selected cell.
import {capturePolygonProfileRequest,capturePolygonProfileFaceRequest} from './selectedProfilePlan.mjs';
import {analyzeSimplePolygon,classifyPolygonPoint,polygonRelation} from '../extrusion/simplePolygon.mjs';
import {hasExactExternalVertexContact} from '../extrusion/exactExternalVertexContact.mjs';
const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
export const POLYGON_PROFILE_CLEARANCE_MM=0.0001;
const tolerance=POLYGON_PROFILE_CLEARANCE_MM;
function distance(p,a,b){
 const x=b[0]-a[0],y=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*x+(p[1]-a[1])*y)/(x*x+y*y)));
 return Math.hypot(p[0]-a[0]-t*x,p[1]-a[1]-t*y);
}
function separation(a,b){
 let min=Infinity;
 for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++)min=Math.min(min,distance(a[i],b[j],b[(j+1)%b.length]),distance(b[j],a[i],a[(i+1)%a.length]));
 return min;
}
function prepareLoop(curves){
 if(curves.length===1&&curves[0].kind==='circle'){
  const c=curves[0];if(c.radius<=tolerance)fail('PROFILE_BELOW_RESOLUTION','Circle is below this kernel adapter resolution.');
  return{kind:'circle',center:c.center.slice(),radius:c.radius,area:Math.PI*c.radius*c.radius};
 }
 if(curves.length<3||curves.some(c=>c.kind!=='segment'))fail('UNSUPPORTED_PROFILE','A boundary must be a full circle or ordered straight segments.');
 if(curves.some((c,i)=>c.b.some((n,j)=>n!==curves[(i+1)%curves.length].a[j])))fail('OPEN_OR_AMBIGUOUS_PROFILE','Endpoints must close exactly; no welding is applied.');
 const p=analyzeSimplePolygon(curves.map(c=>c.a));
 for(let i=0;i<p.vertices.length;i++){
  const a=p.vertices[i],b=p.vertices[(i+1)%p.vertices.length];
  if(Math.hypot(a[0]-b[0],a[1]-b[1])<=tolerance)fail('PROFILE_BELOW_RESOLUTION','An edge is below this kernel adapter resolution.');
  for(let j=i+1;j<p.vertices.length;j++)if(j!==i+1&&!(i===0&&j===p.vertices.length-1)){
   const c=p.vertices[j],d=p.vertices[(j+1)%p.vertices.length];
   if(Math.min(distance(a,c,d),distance(b,c,d),distance(c,a,b),distance(d,a,b))<=tolerance)fail('PROFILE_BELOW_RESOLUTION','Nonadjacent edges are within this kernel adapter clearance.');
  }
 }
 if(p.area<=tolerance*tolerance)fail('PROFILE_BELOW_RESOLUTION','Region area is below this kernel adapter resolution.');
 return{...p,sourceWinding:p.winding,winding:1,vertices:p.winding>0?p.vertices:p.vertices.slice().reverse()};
}
function relation(a,b){
 if(a.kind==='circle'&&b.kind==='circle'){
  const d=Math.hypot(a.center[0]-b.center[0],a.center[1]-b.center[1]);
  return d+b.radius<a.radius-tolerance?'contains':d+a.radius<b.radius-tolerance?'inside':d>a.radius+b.radius+tolerance?'separate':'ambiguous';
 }
 if(a.kind==='polygon'&&b.kind==='polygon'){
  const r=polygonRelation(a,b);return['contains','inside','separate'].includes(r)&&separation(a.vertices,b.vertices)>tolerance?r:'ambiguous';
 }
 const p=a.kind==='polygon'?a:b,c=a.kind==='circle'?a:b;
 const min=Math.min(...p.vertices.map((v,i)=>distance(c.center,v,p.vertices[(i+1)%p.vertices.length])));
 let r=classifyPolygonPoint(p,c.center)==='inside'&&min>c.radius+tolerance?'contains':
  p.vertices.every(v=>Math.hypot(v[0]-c.center[0],v[1]-c.center[1])<c.radius-tolerance)?'inside':
   classifyPolygonPoint(p,c.center)==='outside'&&min>c.radius+tolerance?'separate':'ambiguous';
 if(a.kind==='circle')r=r==='contains'?'inside':r==='inside'?'contains':r;
 return r;
}
function prepareFace(request){
 const f=request.frame;
 const dot=(a,b)=>a.reduce((sum,n,i)=>sum+n*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 if(['x','y','z'].some(k=>Math.abs(dot(f[k],f[k])-1)>1e-12)||[['x','y'],['x','z'],['y','z']].some(([a,b])=>Math.abs(dot(f[a],f[b]))>1e-12)||Math.hypot(...cross(f.x,f.y).map((v,i)=>v-f.z[i]))>1e-12)fail('INVALID_FRAME','A right-handed orthonormal frame is required.');
 const loops=[request.region.outer,...request.region.holes].map(prepareLoop),outer=loops[0],holes=loops.slice(1);
 if(holes.some(h=>relation(outer,h)!=='contains')||holes.some((h,i)=>holes.slice(i+1).some(other=>relation(h,other)!=='separate')))fail('UNSUPPORTED_REGION_TOPOLOGY','Holes must be strictly contained and separate; crossing/touching cells need explicit arrangement.');
 const area=outer.area-holes.reduce((sum,h)=>sum+h.area,0);
 return{frame:f,loops,area};
}
export function preparePolygonProfileFace(input){
 const request=capturePolygonProfileFaceRequest(input),prepared=prepareFace(request),{frame:f,loops}=prepared;
 const world=p=>f.origin.map((n,i)=>n+f.x[i]*p[0]+f.y[i]*p[1]);
 for(const loop of loops){
  const points=loop.kind==='polygon'?loop.vertices.map(world):[world(loop.center)];
  if(points.some(p=>p.some((n,i)=>!Number.isFinite(n)||Math.abs(n)+(loop.kind==='circle'?loop.radius*Math.hypot(f.x[i],f.y[i]):0)>4e6)))fail('INVALID_PROFILE','World geometry exceeds this adapter domain.');
 }
 const nativeValues=[1,...f.origin,...f.x,...f.y,...f.z,loops.length];
 for(const loop of loops)if(loop.kind==='circle')nativeValues.push(1,...loop.center,loop.radius);else nativeValues.push(2,loop.vertices.length,...loop.vertices.flat());
 return{request,...prepared,nativeValues};
}
export function preparePolygonProfileExtrusion(input){
 const request=capturePolygonProfileRequest(input),{frame:f,loops,area}=prepareFace(request),outer=loops[0],volume=area*request.depth;
 if(!Number.isFinite(volume)||volume<=0)fail('INVALID_PROFILE','Selected volume must be positive and finite.');
 const world=p=>f.origin.map((n,i)=>n+f.x[i]*p[0]+f.y[i]*p[1]),delta=f.z.map(n=>n*request.depth);let min,max;
 if(outer.kind==='polygon'){
  const points=outer.vertices.map(world).flatMap(p=>[p,p.map((n,i)=>n+delta[i])]);
  min=[0,1,2].map(i=>Math.min(...points.map(p=>p[i])));max=[0,1,2].map(i=>Math.max(...points.map(p=>p[i])));
 }else{
  const c=world(outer.center),e=[0,1,2].map(i=>outer.radius*Math.hypot(f.x[i],f.y[i]));
  min=c.map((n,i)=>n-e[i]+Math.min(0,delta[i]));max=c.map((n,i)=>n+e[i]+Math.max(0,delta[i]));
 }
 if([...min,...max].some(n=>!Number.isFinite(n)||Math.abs(n)>4e6))fail('INVALID_PROFILE','World geometry exceeds this adapter domain.');
 const values=[request.depth,...f.origin,...f.x,...f.y,...f.z,loops.length];
 for(const loop of loops)if(loop.kind==='circle')values.push(1,...loop.center,loop.radius);else values.push(2,loop.vertices.length,...loop.vertices.flat());
 return{request,frame:f,depth:request.depth,loops,expected:{volume,bounds:{min,max}},nativeValues:values};
}

// Shared discovery uses the SAME conservative provider relationship as actual
// extrusion. Inputs are already prepared ordinary loops, not admission proof.
export {relation as polygonProfileRelation};
export function polygonProfileRegions(profiles){
 if(!Array.isArray(profiles)||!profiles.length||profiles.length>128)fail('UNSUPPORTED_REGION_TOPOLOGY','Expected1–128 prepared closed boundaries.');
 let vertices=0;
 for(const p of profiles){
  if(!p||!['circle','polygon'].includes(p.kind)||!Number.isFinite(p.area)||p.area<=0)fail('INVALID_PROFILE','Expected prepared positive-area boundaries.');
  if(p.kind==='polygon'&&(!Array.isArray(p.vertices)||p.vertices.length<3||p.vertices.length>512||(vertices+=p.vertices.length)>4096))fail('UNSUPPORTED_PROFILE','Prepared polygon boundaries exceed the bounded source domain.');
 }
 const parent=profiles.map(()=>-1);
 for(let i=0;i<profiles.length;i++)for(let j=i+1;j<profiles.length;j++){
  // Separate selected bodies may share isolated exterior vertices. This
  // does not relax actual hole/face preparation or claim a manifold union.
  const r=hasExactExternalVertexContact(profiles[i],profiles[j])?'separate':relation(profiles[i],profiles[j]);
  if(!['contains','inside','separate'].includes(r))fail('UNSUPPORTED_REGION_TOPOLOGY','Profiles intersect, touch or are too close; explicit arrangement is required.');
  if(r==='contains'&&(parent[j]===-1||profiles[i].area<profiles[parent[j]].area))parent[j]=i;
  if(r==='inside'&&(parent[i]===-1||profiles[j].area<profiles[parent[i]].area))parent[i]=j;
 }
 const depth=index=>{let n=0;while(parent[index]!==-1){index=parent[index];if(++n>profiles.length)fail('UNSUPPORTED_REGION_TOPOLOGY','Prepared boundary nesting is cyclic.');}return n;};
 return profiles.map((_,i)=>({outer:i,holes:parent.flatMap((p,j)=>p===i?[j]:[]),depth:depth(i)}));
}
