// Worker-only finite-cylinder / complete current prismatic-domain observations.
// Caller authenticates actual owner/build/topology/source before invoking.
// No public proof flag, Native ordinal, cached geometry or persistent handle.
import {validateOwnedTopology} from './ownedTopologyContract.mjs';
// Finite cylinder qualification only; other bore observation failures are separate.
export const FINITE_CYLINDER_REFUSAL_CODES=Object.freeze(['DRAWING_FINITE_EXTENT_UNQUALIFIED','DRAWING_AXIS_UNSUPPORTED']);
const tol=1e-7,dirTol=1e-8;
const sub=(a,b)=>a.map((n,i)=>n-b[i]),add=(a,b)=>a.map((n,i)=>n+b[i]),mul=(a,n)=>a.map(x=>x*n),dot=(a,b)=>a.reduce((n,x,i)=>n+x*b[i],0),norm=a=>Math.hypot(...a),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],near=(a,b)=>norm(sub(a,b))<=tol;
const unavailable=reason=>{throw Object.assign(Error(reason),{code:reason});};
export function inspectFiniteCylinder(topology,witness,frame){
 const face=topology.faces[witness.resultFace-1],c=face?.analytic;if(face?.type!=='cylinder'||face.wires.length!==1||face.wires[0].length!==4)unavailable('DRAWING_FINITE_EXTENT_UNQUALIFIED');const uses=face.wires[0],rims=uses.filter(x=>!x.seam),seams=uses.filter(x=>x.seam);
 if(rims.length!==2||rims[0].edge===rims[1].edge||seams.length!==2||seams[0].edge!==seams[1].edge||!['FORWARD','REVERSED'].every(o=>seams.some(x=>x.orientation===o)))unavailable('DRAWING_FINITE_EXTENT_UNQUALIFIED');
 const circles=rims.map(u=>topology.edges[u.edge-1]),line=topology.edges[seams[0].edge-1];for(const edge of circles){const a=edge.analytic;if(edge.degenerated||edge.type!=='circle'||edge.vertices[0]!==edge.vertices[1]||Math.abs(edge.range[1]-edge.range[0]-2*Math.PI)>dirTol||Math.abs(a.radius-c.radius)>tol||norm(cross(a.axis,c.axis))>dirTol||norm(cross(sub(a.center,c.origin),c.axis))>tol)unavailable('DRAWING_FINITE_EXTENT_UNQUALIFIED');const p=a.center.map((n,i)=>n+a.radius*(a.x[i]*Math.cos(edge.range[0])+a.y[i]*Math.sin(edge.range[0])));if(!near(p,topology.vertices[edge.vertices[0]-1].point))unavailable('DRAWING_FINITE_EXTENT_UNQUALIFIED');}
 if(line.degenerated||line.type!=='line'||norm(cross(line.analytic.direction,c.axis))>dirTol||JSON.stringify([...line.vertices].sort((a,b)=>a-b))!==JSON.stringify(circles.map(e=>e.vertices[0]).sort((a,b)=>a-b)))unavailable('DRAWING_FINITE_EXTENT_UNQUALIFIED');const ends=line.range.map(t=>add(line.analytic.origin,mul(line.analytic.direction,t)));if(!line.vertices.every(i=>ends.some(p=>near(p,topology.vertices[i-1].point))))unavailable('DRAWING_FINITE_EXTENT_UNQUALIFIED');
 const span=circles.map(e=>dot(sub(e.analytic.center,frame.origin),frame.z)).sort((a,b)=>a-b);if(Math.abs(span[0])>tol||Math.abs(span[1]-frame.depth)>tol||norm(cross(c.axis,frame.z))>dirTol)unavailable('DRAWING_FINITE_EXTENT_UNQUALIFIED');const denominator=dot(c.axis,frame.z);if(Math.abs(denominator)<=dirTol)unavailable('DRAWING_AXIS_UNSUPPORTED');const intersection=add(c.origin,mul(c.axis,dot(sub(frame.origin,c.origin),frame.z)/denominator)),mid=mul(add(circles[0].analytic.center,circles[1].analytic.center),.5);let x=sub(frame.x,mul(c.axis,dot(frame.x,c.axis)));if(norm(x)<=dirTol)unavailable('DRAWING_AXIS_UNSUPPORTED');x=mul(x,1/norm(x));return{radius:c.radius,intersection,diameterAnchors:[add(mid,mul(x,-c.radius)),add(mid,mul(x,c.radius))],ends:circles.map(e=>[...e.analytic.center]).sort((a,b)=>dot(sub(a,frame.origin),frame.z)-dot(sub(b,frame.origin),frame.z)),axis:[...c.axis]};
}

function slabDomain(topology,frame){
 validateOwnedTopology(topology);
 if(topology.solidCount!==1||!(frame.depth>2*tol))unavailable('DRAWING_THROUGH_EXTENT_UNQUALIFIED');
 // A qualitative THRU certificate must not merge two distinct cap levels by
 // tolerance (a thin later cover could otherwise look like the old end plane).
 // Initial supported family: exact principal signed-permutation source frame.
 const basis=[frame.x,frame.y,frame.z],axes=basis.map(v=>{const at=v.findIndex(n=>Math.abs(n)===1);if(at<0||v.some((n,i)=>i!==at&&n!==0))unavailable('DRAWING_THROUGH_EXTENT_UNQUALIFIED');return at;});
 if(new Set(axes).size!==3)unavailable('DRAWING_THROUGH_EXTENT_UNQUALIFIED');
 const axis=axes[2],first=frame.origin[axis],last=first+frame.z[axis]*frame.depth;
 if(!Number.isFinite(last)||first===last)unavailable('DRAWING_THROUGH_EXTENT_UNQUALIFIED');
 const level=p=>{if(p[axis]===first)return 0;if(p[axis]===last)return 1;unavailable('DRAWING_THROUGH_EXTENT_UNQUALIFIED');};
 const caps=new Map(),owners=new Map(),usedVertices=new Set();
 for(const vertex of topology.vertices)level(vertex.point);
 for(const face of topology.faces){
  if(!['FORWARD','REVERSED'].includes(face.orientation)||!face.wires.length||face.wires.some(w=>!w.length))unavailable('DRAWING_THROUGH_EXTENT_UNQUALIFIED');
  if(face.type==='plane'){
   const n=face.analytic.normal;
   if(norm(cross(n,frame.z))===0)caps.set(face.index,level(face.analytic.origin));
   else if(dot(n,frame.z)!==0)unavailable('DRAWING_THROUGH_EXTENT_UNQUALIFIED');
  }else if(face.type!=='cylinder'||norm(cross(face.analytic.axis,frame.z))!==0)unavailable('DRAWING_THROUGH_EXTENT_UNQUALIFIED');
  for(const wire of face.wires)for(const use of wire){
   if(!['FORWARD','REVERSED'].includes(use.orientation))unavailable('DRAWING_THROUGH_EXTENT_UNQUALIFIED');
   if(caps.has(face.index)&&topology.edges[use.edge-1].vertices.some(i=>i<1||level(topology.vertices[i-1].point)!==caps.get(face.index)))unavailable('DRAWING_THROUGH_EXTENT_UNQUALIFIED');
   if(!owners.has(use.edge))owners.set(use.edge,[]);
   owners.get(use.edge).push({face:face.index,seam:use.seam,orientation:use.orientation});
  }
 }
 if(![0,1].every(n=>[...caps.values()].includes(n)))unavailable('DRAWING_THROUGH_EXTENT_UNQUALIFIED');
 for(const edge of topology.edges){
  const uses=owners.get(edge.index)||[];
  if(uses.length!==2||(uses[0].face===uses[1].face?uses.some(u=>!u.seam)||uses[0].orientation===uses[1].orientation:uses.some(u=>u.seam)))unavailable('DRAWING_THROUGH_EXTENT_UNQUALIFIED');
  if(edge.degenerated||edge.vertices.some(i=>i<1)||!(edge.range[1]>edge.range[0]))unavailable('DRAWING_THROUGH_EXTENT_UNQUALIFIED');
  const ends=edge.vertices.map(i=>{usedVertices.add(i);return topology.vertices[i-1].point;}),levels=ends.map(level);
  if(edge.type==='line'){
   const p=edge.range.map(t=>add(edge.analytic.origin,mul(edge.analytic.direction,t)));
   if(!ends.every(v=>p.some(q=>near(v,q))))unavailable('DRAWING_THROUGH_EXTENT_UNQUALIFIED');p.forEach(level);
   if(norm(cross(edge.analytic.direction,frame.z))===0){if(levels[0]===levels[1])unavailable('DRAWING_THROUGH_EXTENT_UNQUALIFIED');}
   else if(dot(edge.analytic.direction,frame.z)!==0||levels[0]!==levels[1])unavailable('DRAWING_THROUGH_EXTENT_UNQUALIFIED');
  }else if(edge.type==='circle'){
   const a=edge.analytic;
   if(norm(cross(a.axis,frame.z))!==0||dot(a.x,frame.z)!==0||dot(a.y,frame.z)!==0||Math.abs(dot(a.x,a.y))>dirTol||norm(sub(cross(a.x,a.y),a.axis))>dirTol||edge.range[1]-edge.range[0]>2*Math.PI+dirTol)unavailable('DRAWING_THROUGH_EXTENT_UNQUALIFIED');
   const cap=level(a.center);if(levels.some(n=>n!==cap))unavailable('DRAWING_THROUGH_EXTENT_UNQUALIFIED');
   const p=edge.range.map(t=>add(a.center,mul(add(mul(a.x,Math.cos(t)),mul(a.y,Math.sin(t))),a.radius)));
   if(!ends.every(v=>p.some(q=>near(v,q))))unavailable('DRAWING_THROUGH_EXTENT_UNQUALIFIED');p.forEach(level);
  }else unavailable('DRAWING_THROUGH_EXTENT_UNQUALIFIED');
 }
 if(usedVertices.size!==topology.vertices.length)unavailable('DRAWING_THROUGH_EXTENT_UNQUALIFIED');
 return {caps,owners,level};
}
// Boundary supports everywhere inside the two end planes are parallel to the
// slab axis, and all trims are generators or end-plane curves. With the actual
// valid bounded single-solid this proves constant cross-section in the open
// slab; the point reads below only corroborate the void/material side.
export function createPrismaticBoreObserver(topology,frame,classify){
 let domain=null,reason=null;
 try{domain=slabDomain(topology,frame);}catch(e){if(e?.code!=='DRAWING_THROUGH_EXTENT_UNQUALIFIED')throw e;reason=e.code;}
 return Object.freeze({read(witness){
  const finite=inspectFiniteCylinder(topology,witness,frame);
  let through;
  try{
   if(!domain)unavailable(reason);
   const face=topology.faces[witness.resultFace-1],rims=face.wires[0].filter(u=>!u.seam);
   for(const rim of rims){
    const others=domain.owners.get(rim.edge).filter(u=>u.face!==face.index);
    if(others.length!==1||!domain.caps.has(others[0].face)||domain.caps.get(others[0].face)!==domain.level(topology.edges[rim.edge-1].analytic.center))unavailable('DRAWING_THROUGH_EXTENT_UNQUALIFIED');
   }
   if(typeof classify!=='function')unavailable('DRAWING_THROUGH_VOID_UNQUALIFIED');
   const center=mul(add(finite.ends[0],finite.ends[1]),.5),material=add(center,mul(frame.x,finite.radius+.5));
   if([...center,...material].some(n=>!Number.isFinite(n)||Math.abs(n)>4e6))unavailable('DRAWING_THROUGH_VOID_UNQUALIFIED');
   if(classify(center)!=='outside'||classify(material)!=='inside')unavailable('DRAWING_THROUGH_VOID_UNQUALIFIED');
   through=Object.freeze({status:'available',reason:null});
  }catch(e){if(!['DRAWING_THROUGH_EXTENT_UNQUALIFIED','DRAWING_THROUGH_VOID_UNQUALIFIED'].includes(e?.code))throw e;through=Object.freeze({status:'unqualified',reason:e.code});}
  return Object.freeze({...finite,through});
 }});
}
