import {validatePrismBoundary} from './boundedPrismBoundary.mjs';
// Research only: validates data, not same-mount ownership or publication.
import {planFourCornerHoles} from './fourCornerHolePlan.mjs';
import {planCenteredHole} from './centeredHolePlan.mjs';
import {validateCenteredCut} from './centeredHoleTopology.mjs';
import {validateFourCornerProvenance} from './fourCornerHoleProvenance.mjs';
const fail = message => { throw Error(message); };
const exact = (v,keys) => v && typeof v==='object' && !Array.isArray(v) && Object.keys(v).sort().join(',') === [...keys].sort().join(',');
const dense = (a,n) => Array.isArray(a) && a.length===n && Array.from({length:n},(_,i)=>Object.hasOwn(a,i)).every(Boolean);
const vec = a => dense(a,3) && a.every(Number.isFinite);
const near = (a,b,t=1e-6) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a-b)<=t;
const dot = (a,b) => a.reduce((n,v,i)=>n+v*b[i],0);
const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const sub = (a,b) => a.map((v,i)=>v-b[i]);
function frame(x,y,z) {
 return [x,y,z].every(vec) && [x,y,z].every(v=>near(dot(v,v),1,1e-8)) && Math.abs(dot(x,y))<1e-8 && Math.abs(dot(y,z))<1e-8 && Math.abs(dot(x,z))<1e-8 && near(dot(cross(x,y),z),1,1e-8);
}
function snapshot(value, depth=0, budget={nodes:0}) {
 if (++budget.nodes>100000 || depth>14) fail('Response exceeds limits');
 if (value===null || typeof value==='boolean') return value;
 if (typeof value==='number') {if (!Number.isFinite(value)||Math.abs(value)>1e12) fail('Invalid number');return value;}
 if (typeof value==='string') {if (value.length>8192) fail('String exceeds limit');return value;}
 if (!value || typeof value!=='object') fail('Invalid value');
 const keys=Reflect.ownKeys(value);if(keys.some(k=>typeof k!=='string'))fail('Symbol property');
 if(Array.isArray(value)) {
  if(value.length>4096||keys.length!==value.length+1)fail('Invalid array');
  return Array.from({length:value.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(value,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('Invalid member');return snapshot(d.value,depth+1,budget);});
 }
 if(keys.length>32)fail('Too many properties');const out=Object.create(null);
 for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(key==='__proto__'||!d?.enumerable||!Object.hasOwn(d,'value'))fail('Invalid property');out[key]=snapshot(d.value,depth+1,budget);}return out;
}
export function validateFourCornerTopology(rawInput,parentInput,profile,centerRequest,cornerRequest) {
 const raw=snapshot(rawInput),parent=snapshot(parentInput);
 profile=snapshot(profile);centerRequest=snapshot(centerRequest);cornerRequest=snapshot(cornerRequest);
 const plan=planFourCornerHoles(profile,centerRequest,cornerRequest);
 validateCenteredCut(parent,planCenteredHole(profile,centerRequest),profile);
 const keys=['version','scope','solidCount','valid','signedVolume','vertices','faces','parentFaces','toolFaces','operation','fourCornerTools'];
 if(!exact(raw,keys)||raw.version!==1||raw.scope!=='response-local'||raw.operation!=='codi-four-corner-cut/1'||raw.solidCount!==1||raw.valid!==true||!dense(raw.vertices,18)||!raw.vertices.every(vec)||!dense(raw.faces,11))fail('Invalid envelope');
 const origin=profile.worldVertices[0];
 const area=Math.abs(profile.worldVertices.reduce((sum,p,i)=>{const q=profile.worldVertices[(i+1)%4];return sum+(p[0]-origin[0])*(q[1]-origin[1])-(q[0]-origin[0])*(p[1]-origin[1]);},0))/2;
 const expected=(area-Math.PI*(plan.existingHole.radius**2+plan.corners.reduce((s,c)=>s+c.radius**2,0)))*plan.depth;
 if(!near(raw.signedVolume,expected,Math.max(1e-6,expected*1e-8)))fail('Wrong analytic volume');
 const edgeUses=new Map(),mesh=new Map(),bounds={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};let triangleCount=0,meshVolume=0;
 const holes=[plan.existingHole,...plan.corners];
 for(let fi=0;fi<raw.faces.length;fi++) {
  const f=raw.faces[fi],plane=f.type==='plane',cylinder=f.type==='cylinder';
  if(!plane&&!cylinder)fail('Unsupported face');
  const fields=plane?['orientation','uv','type','origin','normal','xDirection','yDirection','triangles','loops']:['orientation','uv','type','origin','axis','xDirection','yDirection','radius','triangles','loops'];
  if(!exact(f,fields)||!['FORWARD','REVERSED'].includes(f.orientation)||!dense(f.uv,4)||!f.uv.every(Number.isFinite)||!vec(f.origin)||!frame(f.xDirection,f.yDirection,plane?f.normal:f.axis)||!Array.isArray(f.triangles)||f.triangles.length<1||f.triangles.length>4096||!Array.isArray(f.loops)||f.loops.length<1||f.loops.length>6)fail('Invalid face');
  if(cylinder&&(f.orientation!=='REVERSED'||!near(Math.abs(f.axis[2]),1,1e-8)||holes.filter(h=>near(h.center[0],f.origin[0])&&near(h.center[1],f.origin[1])&&near(h.radius,f.radius)).length!==1))fail('Invalid wall');
  for(const tri of f.triangles) {
   if(!dense(tri,3)||!tri.every(vec)||++triangleCount>10000)fail('Invalid mesh');
   for(const p of tri) {
    const relative=sub(p,f.origin);
    if(plane && Math.abs(dot(relative,f.normal))>1e-5)fail('Mesh leaves plane');
    if(cylinder) {const axial=dot(relative,f.axis),radial=sub(relative,f.axis.map(v=>v*axial));if(!near(Math.hypot(...radial),f.radius,1e-5))fail('Mesh leaves cylinder');}
    for(let i=0;i<3;i++){bounds.min[i]=Math.min(bounds.min[i],p[i]);bounds.max[i]=Math.max(bounds.max[i],p[i]);}
   }
   const key=p=>p.map(n=>Math.round(n*1e6)).join(',');
   for(let i=0;i<3;i++){const a=key(tri[i]),b=key(tri[(i+1)%3]);if(a===b)fail('Degenerate triangle');const k=a<b?a+'|'+b:b+'|'+a,entry=mesh.get(k)||[0,0];entry[0]++;entry[1]+=(a<b?1:-1)*(f.orientation==='REVERSED'?-1:1);mesh.set(k,entry);}
   const [a,b,c]=tri.map(p=>sub(p,origin));meshVolume+=(f.orientation==='REVERSED'?-1:1)*dot(a,cross(b,c))/6;
  }
  for(const loop of f.loops) {
   if(!Array.isArray(loop)||loop.length<1||loop.length>8)fail('Invalid loop');
   for(let i=0;i<loop.length;i++) {
    const e=loop[i],circle=e.type==='circle';
    const fields=circle?['edge','orientation','start','end','range','type','center','axis','xDirection','yDirection','radius']:[ 'edge','orientation','start','end','range','type','lineOrigin','lineDirection'];
    if(!exact(e,fields)||!['circle','line'].includes(e.type)||!['FORWARD','REVERSED'].includes(e.orientation)||![e.edge,e.start,e.end].every(n=>Number.isSafeInteger(n)&&n>0&&n<=64)||e.start>18||e.end>18||!dense(e.range,2)||!e.range.every(Number.isFinite)||e.end!==loop[(i+1)%loop.length].start)fail('Invalid coedge');
    if(!circle) {
     if(!vec(e.lineOrigin)||!vec(e.lineDirection)||!near(dot(e.lineDirection,e.lineDirection),1,1e-8)||!(e.range[0]<e.range[1]))fail('Invalid analytic line frame');
     const startParameter=e.orientation==='FORWARD'?e.range[0]:e.range[1];
     const endParameter=e.orientation==='FORWARD'?e.range[1]:e.range[0];
     const evaluate=t=>e.lineOrigin.map((v,j)=>v+t*e.lineDirection[j]);
     const start=evaluate(startParameter),end=evaluate(endParameter);
     if(start.some((v,j)=>!near(v,raw.vertices[e.start-1][j],1e-5))||end.some((v,j)=>!near(v,raw.vertices[e.end-1][j],1e-5)))fail('Line frame does not evaluate to coedge endpoints');
    }
    if(circle) {
     if(!vec(e.center)||!frame(e.xDirection,e.yDirection,e.axis)||!near(Math.abs(e.axis[2]),1,1e-8)||!near(Math.abs(e.range[1]-e.range[0]),2*Math.PI,1e-7)||e.start!==e.end||holes.filter(h=>near(e.center[0],h.center[0])&&near(e.center[1],h.center[1])&&near(e.radius,h.radius)).length!==1)fail('Invalid rim');
     const point=raw.vertices[e.start-1],t=e.range[0],want=e.center.map((v,j)=>v+e.radius*(e.xDirection[j]*Math.cos(t)+e.yDirection[j]*Math.sin(t)));if(point.some((v,j)=>!near(v,want[j],1e-5)))fail('Invalid rim vertex');
     if(plane){const normal=f.normal.map(v=>v*(f.orientation==='REVERSED'?-1:1)),sign=Math.sign(e.range[1]-e.range[0])*Math.sign(dot(e.axis,normal))*(e.orientation==='REVERSED'?-1:1);if(Math.abs(dot(sub(e.center,f.origin),f.normal))>1e-6||sign!==-1||loop.length!==1||f.loops.length!==6)fail('Invalid inner loop');}
    }
    const uses=edgeUses.get(e.edge)||[];uses.push({face:fi,e});edgeUses.set(e.edge,uses);
   }
  }
 }
 if(raw.faces.filter(f=>f.type==='plane').length!==6||raw.faces.filter(f=>f.type==='cylinder').length!==5||raw.faces.filter(f=>f.type==='plane'&&f.loops.length===6).length!==2||edgeUses.size!==27||[...mesh.values()].some(([n,o])=>n!==2||o!==0))fail('Incomplete topology');
 const seams=new Set(),rims=new Map();
 for(const uses of edgeUses.values()) {
  if(uses.length!==2)fail('Unpaired edge');const [a,b]=uses;if(a.e.orientation===b.e.orientation||a.e.start!==b.e.end||a.e.end!==b.e.start||a.e.type!==b.e.type)fail('Invalid edge pairing');
  if(a.e.type==='circle') {if(a.face===b.face||[a.face,b.face].filter(i=>raw.faces[i].type==='cylinder').length!==1||['center','axis','xDirection','yDirection','range'].some(k=>a.e[k].some((n,i)=>!near(n,b.e[k][i],1e-8))))fail('Invalid rim pairing');const wall=raw.faces[a.face].type==='cylinder'?a.face:b.face,w=raw.faces[wall];if(!near(a.e.center[0],w.origin[0])||!near(a.e.center[1],w.origin[1])||!near(a.e.radius,w.radius)||!near(a.e.radius,b.e.radius))fail('Rim differs from wall');const entry=rims.get(wall)||[];entry.push(a.e.center[2]);rims.set(wall,entry);}
  else {
   if(['lineOrigin','lineDirection','range'].some(k=>a.e[k].some((n,i)=>!near(n,b.e[k][i],1e-8))))fail('Shared line frames differ');
   if(a.face===b.face){if(raw.faces[a.face].type!=='cylinder'||seams.has(a.face))fail('Invalid seam');seams.add(a.face);}
  }
 }
 for(let i=0;i<11;i++)if(raw.faces[i].type==='cylinder'){const z=rims.get(i);if(!seams.has(i)||!z||z.length!==2||!z.some(v=>near(v,plan.existingHole.center[2]))||!z.some(v=>near(v,plan.existingHole.center[2]+plan.depth)))fail('Not through-all');}
 const min=[0,1,2].map(i=>Math.min(...profile.worldVertices.map(p=>p[i]))),max=[0,1,2].map(i=>Math.max(...profile.worldVertices.map(p=>p[i])));max[2]+=plan.depth;
 if(bounds.min.some((n,i)=>!near(n,min[i]))||bounds.max.some((n,i)=>!near(n,max[i]))||!Number.isFinite(meshVolume)||meshVolume<=0||Math.abs(meshVolume-expected)>Math.max(1e-4,expected*.01))fail('Invalid mesh bounds or volume');
 validatePrismBoundary(raw,profile,plan.depth);
 const ancestry=validateFourCornerProvenance(raw,parent,plan);
 const firstTool=raw.fourCornerTools.find(t=>t.inputIndex===0);
 if(!firstTool||JSON.stringify(raw.toolFaces)!==JSON.stringify(firstTool.faces))fail('Inconsistent legacy tool history');
 for(let i=0;i<7;i++) {
  const rel=raw.parentFaces[i],desc=raw.faces[(rel.same[0]??rel.modified[0])-1],source=parent.faces[i];
  for(const key of ['origin','xDirection','yDirection',source.type==='plane'?'normal':'axis'])
   if(!vec(source[key])||!vec(desc[key])||source[key].some((v,j)=>!near(v,desc[key][j],1e-8)))fail('Parent surface changed');
  if(desc.orientation!==source.orientation)fail('Parent face orientation changed');
 }
 return Object.freeze({analyticVolume:raw.signedVolume,meshVolume,triangleCount,bounds:Object.freeze({min:Object.freeze(bounds.min),max:Object.freeze(bounds.max)}),ancestry});
}
