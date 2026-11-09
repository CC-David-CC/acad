// Pure derived layout, never authored geometry or native/material proof.
import {captureOwnedHoleIntent} from '../solid/ownedHoleIntent.mjs';
import {preparePolygonProfileExtrusion,polygonProfileRelation} from './polygonProfilePlan.mjs';
const MAX_BYTES=524288,MARGIN=1;
const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
function exact(value,keys){
 if(!value||typeof value!=='object'||Array.isArray(value)||![null,Object.prototype].includes(Object.getPrototypeOf(value))||Reflect.ownKeys(value).length!==keys.length)fail('INVALID_REQUEST','Expected exact through-hole data.');
 const out={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('INVALID_REQUEST','Through-hole fields must be own data.');out[key]=d.value;}return out;
}
// Capture every original nested value before any provider can inspect it.
function capture(value){
 const encoder=new TextEncoder(),active=new Set();let bytes=0,nodes=0;
 const charge=n=>{bytes+=n;if(bytes>MAX_BYTES)fail('RESOURCE_LIMIT','Through-hole input exceeds its UTF-8 budget.');};
 function visit(v,depth){
  if(depth>24||++nodes>131072)fail('RESOURCE_LIMIT','Through-hole input exceeds its work budget.');
  if(v===null||typeof v==='boolean'){charge(v===null?4:v?4:5);return v;}
  if(typeof v==='number'){if(!Number.isFinite(v))fail('INVALID_REQUEST','Through-hole data must be finite.');charge(JSON.stringify(v).length);return v;}
  if(typeof v==='string'){if(v.length>16384)fail('RESOURCE_LIMIT','Through-hole text exceeds its bound.');charge(encoder.encode(JSON.stringify(v)).byteLength);return v;}
  if(!v||typeof v!=='object'||active.has(v))fail('INVALID_REQUEST','Through-hole input must be acyclic plain data.');
  const list=Array.isArray(v),proto=Object.getPrototypeOf(v),keys=Reflect.ownKeys(v);
  if(!list&&proto!==null&&proto!==Object.prototype)fail('INVALID_REQUEST','Through-hole input must be plain data.');
  if(list&&v.length>4096)fail('RESOURCE_LIMIT','Through-hole array exceeds its bound.');
  if(list&&keys.length!==v.length+1||!list&&keys.length>32)fail('INVALID_REQUEST','Through-hole data must be bounded and dense.');
  const members=list?Array.from({length:v.length},(_,i)=>String(i)):keys,out=list?[]:{};active.add(v);charge(2+Math.max(0,members.length-1));
  for(const key of members){if(typeof key!=='string'||!list&&(key.length>64||key==='__proto__'))fail('INVALID_REQUEST','Unsupported through-hole key.');const d=Object.getOwnPropertyDescriptor(v,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('INVALID_REQUEST','Through-hole members must be own data.');if(!list)charge(encoder.encode(JSON.stringify(key)).byteLength+1);out[key]=visit(d.value,depth+1);}
  active.delete(v);return out;
 }
 return visit(value,0);
}
const freeze=v=>{if(v&&typeof v==='object'){for(const item of Object.values(v))freeze(item);Object.freeze(v);}return v;};
const dot=(a,b)=>a.reduce((sum,n,i)=>sum+n*b[i],0);
function target(value){
 const m=exact(value,['version','valid','solidCount','nativeVolume','nativeBounds']);
 if(m.version!==2||m.valid!==true||m.solidCount!==1||typeof m.nativeVolume!=='number'||!Number.isFinite(m.nativeVolume)||m.nativeVolume<=0)fail('UNSUPPORTED_TARGET','One current valid measured native solid is required.');
 if(m.nativeBounds===null)fail('UNSUPPORTED_TARGET','Native target bounds are required.');
 const b=exact(m.nativeBounds,['min','max']);
 for(const name of ['min','max'])if(!Array.isArray(b[name])||b[name].length!==3||b[name].some(n=>typeof n!=='number'||!Number.isFinite(n)))fail('UNSUPPORTED_TARGET','Finite native target bounds are required.');
 if(b.min.some((n,i)=>n>=b.max[i]))fail('UNSUPPORTED_TARGET','Native solid bounds must have positive extent.');return b;
}
export function planOwnedThroughHoles(input){
 const args=exact(input,['request','sourceProfile','targetMetrics']),data=capture(args),request=captureOwnedHoleIntent(data.request);
 let prepared;try{prepared=preparePolygonProfileExtrusion(data.sourceProfile);}catch(error){if(error?.code==='INVALID_REQUEST')throw error;fail('UNSUPPORTED_PROFILE','The current source profile is outside the supported rectangle domain.');}
 const source=prepared.request,outer=prepared.loops[0];
 if(source.region.boundaryProvenance)fail('UNSUPPORTED_PROFILE','A derived arrangement cell is not a qualified authored rectangle hole source.');
 if(request.sourceRegionId!==source.region.id)fail('STALE_SOURCE','The originating source region changed.');
 if(source.region.holes.length||outer.kind!=='polygon'||outer.vertices.length!==4||source.region.outer.length!==4)fail('UNSUPPORTED_PROFILE','A single four-segment rectangle with no source holes is required.');
 const vertices=outer.vertices,minX=Math.min(...vertices.map(p=>p[0])),maxX=Math.max(...vertices.map(p=>p[0])),minY=Math.min(...vertices.map(p=>p[1])),maxY=Math.max(...vertices.map(p=>p[1]));
 if(vertices.some((p,i)=>{const q=vertices[(i+1)%4];return (p[0]===q[0])===(p[1]===q[1])||![minX,maxX].includes(p[0])||![minY,maxY].includes(p[1]);})||new Set(vertices.map(p=>JSON.stringify(p))).size!==4){
  let message='The source must be exactly axis-aligned in its own sketch frame.';
  // Passive evidence from the four already-admitted vertices at this exact
  // refusal. Columns: sameX, sameY, xIsMinMax, yIsMinMax. No reconstruction,
  // tolerance, source mutation or second solve grants acceptance here.
  try{
   const edges=vertices.map((p,i)=>{const q=vertices[(i+1)%4];return[p[0]===q[0],p[1]===q[1],[minX,maxX].includes(p[0]),[minY,maxY].includes(p[1])];});
   message=(message+' axis='+JSON.stringify({vertices,edges,unique:new Set(vertices.map(p=>JSON.stringify(p))).size})).slice(0,512);
  }catch{/* Diagnostic formatting must never replace the original refusal. */}
  fail('UNSUPPORTED_PROFILE',message);
 }
 const radius=request.diameter/2,anchors=request.kind==='centered-through'?['center']:['MIN_X_MIN_Y','MAX_X_MIN_Y','MAX_X_MAX_Y','MIN_X_MAX_Y'];
 const centersLocal=request.kind==='centered-through'?[[minX+(maxX-minX)/2,minY+(maxY-minY)/2]]:[[minX+request.offsetX,minY+request.offsetY],[maxX-request.offsetX,minY+request.offsetY],[maxX-request.offsetX,maxY-request.offsetY],[minX+request.offsetX,maxY-request.offsetY]];
 const circles=centersLocal.map(center=>({kind:'circle',center,radius,area:Math.PI*radius*radius}));
 if(circles.some(c=>polygonProfileRelation(outer,c)!=='contains'))fail('HOLE_OUTSIDE_PROFILE','Each hole must strictly clear the rectangle by the qualified profile margin.');
 for(let i=0;i<circles.length;i++)for(let j=i+1;j<circles.length;j++)if(polygonProfileRelation(circles[i],circles[j])!=='separate')fail('HOLES_OVERLAP','The current holes must be strictly separated without touching.');
 const bounds=target(data.targetMetrics),f=source.frame,projections=[];
 for(let i=0;i<8;i++){const point=[0,1,2].map(axis=>(i&(1<<axis)?bounds.max:bounds.min)[axis]);projections.push(dot(point.map((n,axis)=>n-f.origin[axis]),f.z));}
 const min=Math.min(...projections),max=Math.max(...projections),start=min-MARGIN,end=max+MARGIN,depth=end-start;
 if(![min,max,start,end,depth].every(Number.isFinite)||!(min<max&&start<min&&end>max&&depth>0&&depth<=1e6))fail('TOOL_DOMAIN','The full native target span cannot be represented by a bounded through tool.');
 const expectedRemovedVolume=circles.length*Math.PI*radius*radius*source.depth;
 if(!Number.isFinite(expectedRemovedVolume)||expectedRemovedVolume<=0)fail('TOOL_DOMAIN','The expected prismatic removal is outside the numeric domain.');
 const toolProfiles=centersLocal.map((center,i)=>{
  const label='derived-through-hole:'+request.featureId+':'+anchors[i],frame={origin:f.origin.map((n,axis)=>n+f.z[axis]*start),x:f.x.slice(),y:f.y.slice(),z:f.z.slice()};
  const profile={op:'solid.profile.extrude',version:3,unit:'millimeter',frame,depth,region:{id:label,outer:[{kind:'circle',id:label+':circle',center:center.slice(),radius}],holes:[]}};
  try{preparePolygonProfileExtrusion(profile);}catch{fail('TOOL_DOMAIN','A derived through tool exceeds the qualified V3 construction domain.');}
  // Check representable coverage after the actual additions, not just an
  // ideal interval. Source axes are the qualified orthonormal frame.
  const first=frame.origin.map((n,axis)=>n+f.x[axis]*center[0]+f.y[axis]*center[1]),last=first.map((n,axis)=>n+f.z[axis]*depth),a=dot(first.map((n,axis)=>n-f.origin[axis]),f.z),b=dot(last.map((n,axis)=>n-f.origin[axis]),f.z);
  if(![...first,...last,a,b].every(Number.isFinite)||!(a<min&&b>max))fail('TOOL_DOMAIN','Floating-point tool endpoints do not fully cross the measured target.');return profile;
 });
 return freeze({version:1,sourceRegionId:source.region.id,slots:anchors.slice(),centersLocal,radius,toolProfiles,expectedRemovedVolume,axialSpan:{min,max},scope:'rectangle-source-native-aabb-through'});
}
