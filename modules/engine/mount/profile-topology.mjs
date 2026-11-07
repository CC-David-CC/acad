// A bounded response-local description, not persistent CAD topology IDs.
const fail = message => { throw Error('Invalid prism topology: '+message); };
const dense = v => Array.isArray(v) && v.length<=192 && Array.from({length:v.length},(_,i)=>Object.hasOwn(v,i)).every(Boolean);
const vec = v => dense(v)&&v.length===3&&v.every(Number.isFinite);
const finiteArray = v => dense(v)&&v.every(Number.isFinite);
const dist = (a,b)=>Math.hypot(...a.map((n,i)=>n-b[i]));
const TOL=1e-6;
export function extractPrismTopology(result,prepared,ancestry) {
 if(!dense(result?.faces)||result.faces.length!==6||!dense(prepared?.worldVertices)||prepared.worldVertices.length!==4||!prepared.worldVertices.every(vec)||!dense(ancestry)||ancestry.length!==4)fail('invalid inputs');
 const vertices=[],edges=[],faces=[],groups=new Map();let triangles=0;
 function vertex(p) {
  if(!vec(p))fail('invalid vertex');
  const matches=vertices.filter(v=>dist(v.point,p)<=TOL);
  if(matches.length>1)fail('ambiguous vertices');
  if(matches.length){if(dist(matches[0].point,p)!==0)fail('inconsistent shared vertex');return matches[0].id;}
  if(vertices.length>=8)fail('too many vertices');const id='vertex:'+vertices.length;vertices.push({id,point:[...p]});return id;
 }
 for(let fi=0;fi<6;fi++){
  const f=result.faces[fi],s=f?.surface;
  if(!s||s.TYPE!=='PLANE'||!vec(s.origin)||!vec(s.normal)||typeof s.direct!=='boolean'||typeof f.inverted!=='boolean'||Math.abs(Math.hypot(...s.normal)-1)>1e-7||!dense(f.loops)||f.loops.length!==1||!dense(f.loops[0])||f.loops[0].length!==4||!dense(f.tess)||f.tess.length>32)fail('invalid face');
  const loop=[];
  for(const e of f.loops[0]){
   if(!Number.isSafeInteger(e?.edgeRef)||e.edgeRef<1||!vec(e.a)||!vec(e.b)||dist(e.a,e.b)<=2*TOL||typeof e.inverted!=='boolean'||!finiteArray(e.curveBounds)||e.curveBounds.length!==2||!dense(e.tess)||e.tess.length<2||e.tess.length>64||!e.tess.every(vec)||e.curve?.TYPE!=='B-SPLINE'||e.curve.deg!==1||!dense(e.curve.cp)||e.curve.cp.length!==2||!e.curve.cp.every(vec)||!dense(e.curve.weights)||e.curve.weights.length!==2||e.curve.weights.some(w=>w!==1))fail('invalid straight edge');
   const a=vertex(e.a),b=vertex(e.b);if(a===b)fail('degenerate edge');
   const spans=(points)=>dist(points[0],e.a)<=TOL&&dist(points[points.length-1],e.b)<=TOL||dist(points[0],e.b)<=TOL&&dist(points[points.length-1],e.a)<=TOL;
   if(!spans(e.curve.cp)||!spans(e.tess))fail('edge endpoints do not match curve');
   const line=[...e.curve.cp,...e.tess];for(const p of line){const ab=e.b.map((n,i)=>n-e.a[i]),ap=p.map((n,i)=>n-e.a[i]),len=Math.hypot(...ab),t=ap.reduce((n,v,i)=>n+v*ab[i],0)/(len*len),perp=Math.hypot(...ap.map((n,i)=>n-t*ab[i]));if(perp>TOL||t < -TOL/len||t>1+TOL/len)fail('nonlinear edge');}
   let g=groups.get(e.edgeRef);if(!g){if(edges.length>=12||edges.some(other=>other.a===a&&other.b===b||other.a===b&&other.b===a))fail('too many or coincident edges');g={id:'edge:'+edges.length,curve:{type:'line-segment',tessellation:e.tess.map(p=>[...p])},a,b,uses:[]};groups.set(e.edgeRef,g);edges.push(g);}else if(!((g.a===a&&g.b===b)||(g.a===b&&g.b===a)))fail('inconsistent shared edge');
   const reversed=e.inverted !== (g.a!==a);g.uses.push({face:'face:'+fi,reversed});loop.push({edge:g.id,reversed});
  }
  if(new Set(loop.map(x=>x.edge)).size!==4)fail('duplicate loop edge');
  const endpoint=(use,end)=>{const edge=edges[Number(use.edge.slice(5))];return (use.reversed!==end)?edge.b:edge.a;};
  for(let i=0;i<4;i++)if(endpoint(loop[i],true)!==endpoint(loop[(i+1)%4],false))fail('disconnected oriented loop');
  const tess=f.tess.map(item=>{const t=item?.[0];if(!dense(t)||t.length!==3||!t.every(vec)||++triangles>192)fail('invalid tessellation');
   for(const p of t)if(Math.abs(p.reduce((n,x,i)=>n+(x-s.origin[i])*s.normal[i],0))>TOL)fail('triangle off plane');
   const a=t[1].map((n,i)=>n-t[0][i]),b=t[2].map((n,i)=>n-t[0][i]),cross=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
   if(!Number.isFinite(Math.hypot(...cross))||Math.hypot(...cross)<=TOL*TOL)fail('degenerate triangle');return t.map(p=>[...p]);});
  if(!tess.length)fail('empty tessellation');
  for(const use of loop){const e=edges[Number(use.edge.slice(5))];for(const id of [e.a,e.b]){const p=vertices[Number(id.slice(7))].point;if(Math.abs(p.reduce((n,x,i)=>n+(x-s.origin[i])*s.normal[i],0))>TOL)fail('vertex off plane');}}
  faces.push({id:'face:'+fi,plane:{origin:[...s.origin],normal:[...s.normal],direct:s.direct},inverted:f.inverted,loop,triangles:tess});
 }
 if(vertices.length!==8||edges.length!==12||edges.some(e=>e.uses.length!==2||e.uses[0].face===e.uses[1].face||e.uses[0].reversed===e.uses[1].reversed))fail('inconsistent solid incidence');
 const sourceEdges=ancestry.map((a,i)=>{if(typeof a.sourceEdgeId!=='string'||!Number.isInteger(a.faceOrdinal)||a.faceOrdinal<0||a.faceOrdinal>=6)fail('invalid ancestry');const p=prepared.worldVertices[i],q=prepared.worldVertices[(i+1)%4],matches=edges.filter(e=>{const u=vertices[Number(e.a.slice(7))].point,v=vertices[Number(e.b.slice(7))].point;return dist(u,p)<=TOL&&dist(v,q)<=TOL||dist(v,p)<=TOL&&dist(u,q)<=TOL});if(matches.length!==1||!matches[0].uses.some(u=>u.face==='face:'+a.faceOrdinal))fail('ambiguous source ancestry');return {sourceEdgeId:a.sourceEdgeId,baseEdge:matches[0].id,sweptFace:'face:'+a.faceOrdinal,sourceReversed:a.sourceReversed};});
 if(new Set(sourceEdges.map(e=>e.baseEdge)).size!==4||new Set(sourceEdges.map(e=>e.sourceEdgeId)).size!==4)fail('duplicate ancestry');
 const output={version:1,unit:'millimeter',idScope:'response-local',toleranceMm:TOL,vertices,edges,faces,sourceEdges};
 if(new TextEncoder().encode(JSON.stringify(output)).byteLength>16384)fail('serialized topology exceeds 16384 bytes');
 return output;
}
