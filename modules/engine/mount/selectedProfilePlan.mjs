import {captureArrangementBoundary} from '../extrusion/selectedArrangementDescriptor.mjs';
// Common selected-region geometry contract. No sketch solving, document writes,
// native allocation or implicit region selection takes place here.
const fail=(code,message)=>{const e=new Error(message);e.code=code;throw e;};
const record=(value,keys)=>{
 const proto=value&&typeof value==='object'?Object.getPrototypeOf(value):undefined;
 if(!value||typeof value!=='object'||Array.isArray(value)||(proto!==null&&proto!==Object.prototype)||Reflect.ownKeys(value).length!==keys.length||Reflect.ownKeys(value).some(k=>typeof k!=='string'||!keys.includes(k)))fail('INVALID_REQUEST','Expected exact profile data fields.');
 const out={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('INVALID_REQUEST','Profile fields must be data.');out[key]=d.value;}return out;
};
const array=(v,min,max)=>{
 if(!Array.isArray(v)||v.length<min||v.length>max||Reflect.ownKeys(v).length!==v.length+1)fail('INVALID_REQUEST','Invalid bounded profile array.');
 return Array.from({length:v.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(v,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('INVALID_REQUEST','Profile arrays must be dense data.');return d.value;});
};
const vector=(v,n)=>array(v,n,n).map(x=>{if(typeof x!=='number'||!Number.isFinite(x)||Math.abs(x)>1e6)fail('INVALID_REQUEST','Profile coordinates must be finite bounded numbers.');return x;});
const id=(v,max=256)=>{if(typeof v!=='string'||!v||v.length>max)fail('INVALID_REQUEST','Invalid authored profile identity.');return v;};
function captureRequest(request,version,maxLoop,maxTotal,maxHoles){
 const r=record(request,['op','version','unit','frame','depth','region']);
 if(r.op!=='solid.profile.extrude'||r.version!==version||r.unit!=='millimeter')fail('INVALID_REQUEST','Unsupported selected-profile request.');
 if(typeof r.depth!=='number'||!Number.isFinite(r.depth)||r.depth<=0||r.depth>1e6)fail('INVALID_REQUEST','Positive bounded millimeter depth is required.');
 Object.assign(r,captureGeometry(r.frame,r.region,version,maxLoop,maxTotal,maxHoles));return r;
}
function captureGeometry(frame,inputRegion,version,maxLoop,maxTotal,maxHoles){
 const r={};
 const f=record(frame,['origin','x','y','z']);r.frame=Object.fromEntries(Object.entries(f).map(([key,v])=>[key,vector(v,3)]));
 const arranged=Object.getOwnPropertyDescriptor(inputRegion||{},'boundaryProvenance');
 if(arranged&&version!==3)fail('UNSUPPORTED_PROFILE','Arrangement cells require an explicit V3 polygon path.');
 const region=record(inputRegion,['id','outer','holes',...(arranged?['boundaryProvenance']:[])]),ids=new Set();let total=0;
 const loop=value=>array(value,1,maxLoop).map(value=>{
  const kind=Object.getOwnPropertyDescriptor(value||{},'kind');if(!kind?.enumerable||!Object.hasOwn(kind,'value'))fail('INVALID_REQUEST','Profile curves require a data kind.');
  if(!['segment','circle'].includes(kind.value))fail('UNSUPPORTED_PROFILE',version===3?'Only full circles and straight segments are supported.':'Only full circles and rectangle segments are currently supported.');
  const c=record(value,kind.value==='segment'?['kind','id','a','b']:['kind','id','center','radius']);
  c.id=id(c.id);if(ids.has(c.id)||++total>maxTotal)fail('INVALID_REQUEST','Profile identities must be unique and bounded.');ids.add(c.id);
  if(c.kind==='segment'){c.a=vector(c.a,2);c.b=vector(c.b,2);}else{c.center=vector(c.center,2);if(typeof c.radius!=='number'||!Number.isFinite(c.radius)||c.radius<=0||c.radius>1e6)fail('INVALID_PROFILE','Circle radius must be positive and bounded.');}
  return c;
 });
 r.region={id:id(region.id,8192),outer:loop(region.outer),holes:array(region.holes,0,maxHoles).map(loop)};
 if(arranged)r.region.boundaryProvenance=captureArrangementBoundary(region.boundaryProvenance,r.region);return r;
}
export function captureSelectedProfileRequest(request){return captureRequest(request,2,24,24,8);}
export function capturePolygonProfileRequest(request){return captureRequest(request,3,512,4096,128);}
// A genuine planar selected face, with no fictitious extrusion/depth.
export function capturePolygonProfileFaceRequest(request){
 const r=record(request,['version','unit','frame','region']);
 if(r.version!==1||r.unit!=='millimeter')fail('INVALID_REQUEST','Unsupported selected face request.');
 Object.assign(r,captureGeometry(r.frame,r.region,3,512,4096,128));return r;
}
export function prepareSelectedProfileExtrusion(request){
 const r=captureSelectedProfileRequest(request),f=r.frame,tolerance=1e-4;
 const dot=(a,b)=>a.reduce((sum,x,i)=>sum+x*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 if(['x','y','z'].some(k=>Math.abs(dot(f[k],f[k])-1)>1e-12)||[['x','y'],['x','z'],['y','z']].some(([a,b])=>Math.abs(dot(f[a],f[b]))>1e-12)||Math.hypot(...cross(f.x,f.y).map((x,i)=>x-f.z[i]))>1e-12)fail('INVALID_FRAME','A right-handed orthonormal frame is required.');
 const loop=curves=>{
  if(curves.length===1&&curves[0].kind==='circle'){
   const c=curves[0];if(c.radius<=tolerance)fail('INVALID_PROFILE','Circle is below the supported geometric resolution.');
   return{kind:'circle',center:c.center.slice(),radius:c.radius,area:Math.PI*c.radius*c.radius};
  }
  if(curves.length!==4||curves.some(c=>c.kind!=='segment'))fail('UNSUPPORTED_PROFILE','A boundary must be a full circle or four ordered rectangle segments.');
  if(curves.some((c,i)=>c.b.some((v,j)=>v!==curves[(i+1)%4].a[j])))fail('OPEN_OR_AMBIGUOUS_PROFILE','Ordered endpoints must close exactly; no proximity welding is applied.');
  const vertices=curves.map(c=>c.a.slice()),xs=vertices.map(p=>p[0]),ys=vertices.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  if(maxX-minX<=tolerance||maxY-minY<=tolerance)fail('INVALID_PROFILE','Rectangle is below the supported geometric resolution.');
  const corner=p=>p[0]===minX?(p[1]===minY?0:p[1]===maxY?3:-1):p[0]===maxX?(p[1]===minY?1:p[1]===maxY?2:-1):-1;
  const corners=vertices.map(corner);if(corners.includes(-1)||new Set(corners).size!==4||curves.some(c=>!(c.a[0]===c.b[0]&&c.a[1]!==c.b[1]||c.a[1]===c.b[1]&&c.a[0]!==c.b[0])))fail('UNSUPPORTED_PROFILE','Only exact axis-aligned local rectangles are supported.');
  // Reverse traversal only, never authored coordinates or topology membership.
  const signed=vertices.reduce((a,p,i)=>a+(p[0]-minX)*(vertices[(i+1)%4][1]-minY)-(p[1]-minY)*(vertices[(i+1)%4][0]-minX),0);
  return{kind:'rectangle',vertices:signed>0?vertices:vertices.slice().reverse(),minX,maxX,minY,maxY,area:(maxX-minX)*(maxY-minY)};
 };
 const loops=[r.region.outer,...r.region.holes].map(loop),outer=loops[0],holes=loops.slice(1);
 const contains=(a,b)=>a.kind==='circle'?(b.kind==='circle'?Math.hypot(a.center[0]-b.center[0],a.center[1]-b.center[1])+b.radius<a.radius-tolerance:b.vertices.every(p=>Math.hypot(p[0]-a.center[0],p[1]-a.center[1])<a.radius-tolerance)):(b.kind==='circle'?b.center[0]-b.radius>a.minX+tolerance&&b.center[0]+b.radius<a.maxX-tolerance&&b.center[1]-b.radius>a.minY+tolerance&&b.center[1]+b.radius<a.maxY-tolerance:b.minX>a.minX+tolerance&&b.maxX<a.maxX-tolerance&&b.minY>a.minY+tolerance&&b.maxY<a.maxY-tolerance);
 const separate=(a,b)=>{
  if(a.kind==='circle'&&b.kind==='circle')return Math.hypot(a.center[0]-b.center[0],a.center[1]-b.center[1])>a.radius+b.radius+tolerance;
  if(a.kind==='rectangle'&&b.kind==='rectangle')return a.maxX+tolerance<b.minX||b.maxX+tolerance<a.minX||a.maxY+tolerance<b.minY||b.maxY+tolerance<a.minY;
  const rect=a.kind==='rectangle'?a:b,circle=a.kind==='circle'?a:b,x=Math.max(rect.minX,Math.min(circle.center[0],rect.maxX)),y=Math.max(rect.minY,Math.min(circle.center[1],rect.maxY));return Math.hypot(circle.center[0]-x,circle.center[1]-y)>circle.radius+tolerance;
 };
 if(holes.some(h=>!contains(outer,h))||holes.some((h,i)=>holes.slice(i+1).some(other=>!separate(h,other))))fail('UNSUPPORTED_PROFILE','Holes must be strictly contained and mutually separate.');
 const area=outer.area-holes.reduce((sum,h)=>sum+h.area,0),volume=area*r.depth;
 if(!Number.isFinite(volume)||volume<=0)fail('INVALID_PROFILE','Selected region must have positive finite volume.');
 const delta=f.z.map(x=>x*r.depth),world=p=>f.origin.map((x,i)=>x+f.x[i]*p[0]+f.y[i]*p[1]);
 let min,max;
 if(outer.kind==='rectangle'){const points=outer.vertices.map(world).flatMap(p=>[p,p.map((x,i)=>x+delta[i])]);min=[0,1,2].map(i=>Math.min(...points.map(p=>p[i])));max=[0,1,2].map(i=>Math.max(...points.map(p=>p[i])));}
 else{const center=world(outer.center),extent=[0,1,2].map(i=>outer.radius*Math.hypot(f.x[i],f.y[i]));min=center.map((x,i)=>x-extent[i]+Math.min(0,delta[i]));max=center.map((x,i)=>x+extent[i]+Math.max(0,delta[i]));}
 if([...min,...max].some(x=>!Number.isFinite(x)||Math.abs(x)>4e6))fail('INVALID_PROFILE','World geometry exceeds the bounded profile domain.');
 return{request:r,frame:f,depth:r.depth,loops,expected:{volume,bounds:{min,max}},nativeInput:{frame:f,depth:r.depth,loops:loops.map(l=>l.kind==='circle'?{kind:l.kind,center:l.center,radius:l.radius}:{kind:l.kind,vertices:l.vertices})}};
}
