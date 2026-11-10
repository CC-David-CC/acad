import {certifyAnalyticProfileWorldPreparation} from './analyticProfileWorldBudget.mjs';
// Original analytic curves -> bounded exact-closure wire request. Worker only.
import {requireArcInterval,arcSectorContains} from '../extrusion/authoredArcBranch.mjs';
const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
const freeze=v=>{if(v&&typeof v==='object'){for(const x of Object.values(v))freeze(x);Object.freeze(v);}return v;};
export const ANALYTIC_PROFILE_VERSION=1;
export const ANALYTIC_PROFILE_LIMITS=Object.freeze({sourceCurves:170,loops:1,nativeValues:1546,supportIncidenceMm:1e-9,direction:1e-12});
export const ANALYTIC_PROFILE_NATIVE_CODES=Object.freeze(['ANALYTIC_PROFILE_INVALID_REQUEST','ANALYTIC_PROFILE_UNSUPPORTED','ANALYTIC_PROFILE_UNQUALIFIED','ANALYTIC_PROFILE_CONSTRUCTION_FAILED','ANALYTIC_PROFILE_PROVENANCE_UNRESOLVED','ANALYTIC_PROFILE_RESOURCE_LIMIT','ANALYTIC_PROFILE_INPUT_CHANGED','ANALYTIC_PROFILE_NAME_COLLISION','ANALYTIC_PROFILE_PUBLICATION_FAILED','ANALYTIC_PROFILE_ALLOCATION_FAILED','ANALYTIC_PROFILE_BUSY','MEASUREMENT_PRECISION_UNRESOLVED']);
export function analyticProfileFields(v,keys){if(!v||typeof v!=='object'||Array.isArray(v)||![null,Object.prototype].includes(Object.getPrototypeOf(v))||Reflect.ownKeys(v).length!==keys.length)fail('INVALID_REQUEST','Expected exact analytic-profile own data.');const out={};for(const k of keys){const d=Object.getOwnPropertyDescriptor(v,k);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('INVALID_REQUEST','Analytic-profile fields must be data.');out[k]=d.value;}return out;}
function list(v,min,max){if(!Array.isArray(v)||v.length<min||v.length>max||Reflect.ownKeys(v).length!==v.length+1)fail('RESOURCE_LIMIT','Expected bounded dense analytic-profile arrays.');return Array.from({length:v.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(v,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('INVALID_REQUEST','Analytic-profile arrays must be data.');return d.value;});}
function number(v,bound=1e6){if(typeof v!=='number'||!Number.isFinite(v)||Math.abs(v)>bound)fail('INVALID_REQUEST','Expected bounded finite analytic-profile number.');return v;}
const point=v=>list(v,2,2).map(n=>number(n));
const id=(v,max=256)=>{if(typeof v!=='string'||!v||v.length>max)fail('INVALID_REQUEST','Expected bounded original curve identity.');return v;};
const same=(a,b)=>a[0]===b[0]&&a[1]===b[1];
const objectPoint=p=>({x:p[0],y:p[1]});
const arcData=c=>({a:objectPoint(c.a),b:objectPoint(c.b),c:objectPoint(c.center),branch:c.branch});
const start=c=>c.orientation==='forward'?c.a:c.b,end=c=>c.orientation==='forward'?c.b:c.a;
export function captureAnalyticProfileRequest(value){
 const r=analyticProfileFields(value,['op','version','unit','frame','depth','region']);
 if(r.op!=='solid.profile.extrude'||r.version!==5||r.unit!=='millimeter')fail('INVALID_REQUEST','Expected explicit analytic profile version5.');
 r.depth=number(r.depth);if(r.depth<=0)fail('INVALID_REQUEST','Positive millimeter depth is required.');
 const f=analyticProfileFields(r.frame,['origin','x','y','z']);r.frame=Object.fromEntries(Object.entries(f).map(([k,v])=>[k,list(v,3,3).map(n=>number(n))]));
 const region=analyticProfileFields(r.region,['id','outer','holes']);if(list(region.holes,0,128).length)fail('UNSUPPORTED_PROFILE','Analytic-profile holes require a later explicit constructor contract.');
 const ids=new Set();const outer=list(region.outer,1,170).map(value=>{
  const kind=Object.getOwnPropertyDescriptor(value||{},'kind');if(!kind?.enumerable||!Object.hasOwn(kind,'value')||!['segment','arc'].includes(kind.value))fail('UNSUPPORTED_PROFILE','This slice requires genuine Segment and Arc members.');
  const c=analyticProfileFields(value,kind.value==='arc'?['kind','id','a','b','center','branch','orientation']:['kind','id','a','b','orientation']);c.id=id(c.id);if(ids.has(c.id))fail('INVALID_REQUEST','Each original source curve occurs exactly once.');ids.add(c.id);
  c.a=point(c.a);c.b=point(c.b);if(!['forward','reversed'].includes(c.orientation))fail('INVALID_REQUEST','Expected explicit source-curve use orientation.');
  if(c.kind==='arc'){c.center=point(c.center);if(!['proper-ccw','full-ccw'].includes(c.branch))fail('INVALID_REQUEST','A saved analytic Arc requires its exact authored branch.');}else if(same(c.a,c.b))fail('INVALID_PROFILE','A zero-length Segment cannot bound material.');
  return c;
 });if(!outer.some(c=>c.kind==='arc'))fail('UNSUPPORTED_PROFILE','An analytic-profile request must contain an actual Arc.');
 r.region={id:id(region.id,8192),outer,holes:[]};return freeze(r);
}
// Deterministic graph construction changes traversal only, never original Arc
// endpoints/branch. Every source curve participates; no discarded components.
export function orderAnalyticProfileLoop(input){
 const curves=list(input,1,170),samePoint=(a,b)=>same(a,b),full=curves.filter(c=>c.kind==='arc'&&c.branch==='full-ccw');
 if(full.length){if(curves.length!==1)fail('UNSUPPORTED_PROFILE','A full Arc must be the sole boundary in this slice.');return [{...full[0],orientation:'forward'}];}
 const endpoints=new Map(),key=p=>JSON.stringify(p);for(const c of curves)for(const p of [c.a,c.b]){const k=key(p),v=endpoints.get(k)||[];v.push(c);endpoints.set(k,v);}
 if([...endpoints.values()].some(rows=>rows.length!==2))fail('OPEN_OR_AMBIGUOUS_PROFILE','Analytic boundaries require exact degree-two endpoint joins; no proximity welding.');
 const remaining=new Set(curves),first=curves.slice().sort((a,b)=>a.id<b.id?-1:1)[0],origin=first.a;let p=origin;const ordered=[];
 do{const choices=endpoints.get(key(p)).filter(c=>remaining.has(c));if(!choices.length)fail('OPEN_OR_AMBIGUOUS_PROFILE','Analytic boundary has an open or disconnected chain.');const c=choices.sort((a,b)=>a.id<b.id?-1:1)[0],forward=samePoint(c.a,p);ordered.push({...c,orientation:forward?'forward':'reversed'});remaining.delete(c);p=forward?c.b:c.a;}while(!samePoint(p,origin));
 if(remaining.size)fail('UNSUPPORTED_PROFILE','Multiple analytic boundary components require explicit region/holes support.');
 return ordered;
}
export function prepareAnalyticProfileExtrusion(value){
 const request=captureAnalyticProfileRequest(value),f=request.frame,curves=request.region.outer;
 const dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 if(['x','y','z'].some(k=>Math.abs(dot(f[k],f[k])-1)>1e-12)||[['x','y'],['x','z'],['y','z']].some(([a,b])=>Math.abs(dot(f[a],f[b]))>1e-12)||Math.hypot(...cross(f.x,f.y).map((v,i)=>v-f.z[i]))>1e-12)fail('INVALID_FRAME','A right-handed orthonormal original frame is required.');
 const origins=new Set(),key=p=>JSON.stringify(p);let area=0;const anchor=start(curves[0]),facts=new Map();
 for(let i=0;i<curves.length;i++){
  const c=curves[i];if(!same(end(c),start(curves[(i+1)%curves.length])))fail('OPEN_OR_AMBIGUOUS_PROFILE','Every directed source join must close exactly.');if(origins.has(key(start(c))))fail('UNSUPPORTED_PROFILE','Articulated analytic boundaries are outside this first slice.');origins.add(key(start(c)));
  const a=[c.a[0]-anchor[0],c.a[1]-anchor[1]],b=[c.b[0]-anchor[0],c.b[1]-anchor[1]],sign=c.orientation==='forward'?1:-1;
  if(c.kind==='segment'){if(!(Math.hypot(b[0]-a[0],b[1]-a[1])>0))fail('ANALYTIC_PROFILE_UNQUALIFIED','The distinct represented Segment has no usable floating length.');area+=sign*(a[0]*b[1]-a[1]*b[0])/2;}
  else{
   const data=arcData(c),branch=requireArcInterval(data),r=Math.hypot(c.a[0]-c.center[0],c.a[1]-c.center[1]),other=Math.hypot(c.b[0]-c.center[0],c.b[1]-c.center[1]);
   if(!(r>0)||r>1e6)fail('ANALYTIC_PROFILE_UNQUALIFIED','Arc radius is outside the finite represented constructor domain.');
   if(Math.abs(r-other)>1e-9)fail('ANALYTIC_PROFILE_UNQUALIFIED','Original Arc endpoints do not qualify the retained circular support incidence.');
   if(branch.branch==='full-ccw'&&curves.length!==1)fail('UNSUPPORTED_PROFILE','A full Arc must remain a sole periodic loop.');
   const center=[c.center[0]-anchor[0],c.center[1]-anchor[1]];area+=sign*(center[0]*(b[1]-a[1])-center[1]*(b[0]-a[0])+r*r*branch.sweep)/2;facts.set(c.id,{...branch,radius:r});
  }
 }
 if(!Number.isFinite(area)||area===0)fail('UNREPRESENTABLE_AREA','Analytic boundary has no qualified nonzero represented area.');
 // Normalize the temporary wire direction, retaining original source endpoints
 // and mandatory branch in every request row.
 const directed=area>0?curves:curves.slice().reverse().map(c=>({...c,orientation:c.orientation==='forward'?'reversed':'forward'}));
 certifyAnalyticProfileWorldPreparation(f,request.depth,directed);
 area=Math.abs(area);const volume=area*request.depth;if(!Number.isFinite(volume)||volume<=0)fail('UNREPRESENTABLE_AREA','Analytic prism quantity is not representable.');
 const world=(p,i)=>f.origin[i]+f.x[i]*p[0]+f.y[i]*p[1],bounds={min:[],max:[]};
 for(let axis=0;axis<3;axis++){
  const values=[];for(const c of curves){values.push(world(c.a,axis),world(c.b,axis));if(c.kind==='arc'){
   const r=facts.get(c.id).radius,length=Math.hypot(f.x[axis],f.y[axis]);if(length)for(const sign of[-1,1]){const p=[c.center[0]+sign*r*f.x[axis]/length,c.center[1]+sign*r*f.y[axis]/length];if(arcSectorContains(arcData(c),p[0],p[1]))values.push(world(p,axis));}
  }}
  const delta=f.z[axis]*request.depth;bounds.min.push(Math.min(...values)+Math.min(0,delta));bounds.max.push(Math.max(...values)+Math.max(0,delta));
 }
 if([...bounds.min,...bounds.max].some(n=>!Number.isFinite(n)||Math.abs(n)>4e6))fail('INVALID_PROFILE','World analytic geometry exceeds the existing profile envelope.');
 const nativeValues=[1,request.depth,...f.origin,...f.x,...f.y,...f.z,1,directed.length,...directed.flatMap(c=>[c.kind==='arc'?1:0,...c.a,...c.b,...(c.kind==='arc'?c.center:[0,0]),c.kind==='arc'?(c.branch==='full-ccw'?2:1):0,c.orientation==='forward'?1:-1])];
 return freeze({request,frame:f,depth:request.depth,loops:[{kind:'analytic',curves:directed}],nativeValues,expected:{volume,bounds}});
}
