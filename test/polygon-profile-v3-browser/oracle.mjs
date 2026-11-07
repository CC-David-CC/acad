import assert from 'node:assert/strict';
export const near=(a,b,tol=1e-7)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=Math.max(tol,Math.abs(b)*1e-10),`${a} != ${b}`);
const vec=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),norm=a=>Math.hypot(...a),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const samePoint=(a,b)=>a.forEach((v,i)=>near(v,b[i]));
export function inspectSourceBindings(request,construction){
 const binding=construction.sourceBinding;assert.equal(binding.scope,'solved-request');assert.equal(binding.regionId,request.region.id);
 const authored=[request.region.outer,...request.region.holes];assert.equal(binding.nativeSlotBindings.length,authored.length);
 const normalized=binding.nativeSlotBindings.map((loop,i)=>{
  assert.equal(loop.loop,i);assert.equal(loop.edges.length,authored[i].length);const ids=new Set();
  const curves=loop.edges.map((edge,j)=>{
   assert.equal(edge.source,j);assert.equal(typeof edge.nativeReversed,'boolean');assert(!ids.has(edge.curveId));ids.add(edge.curveId);
   const c=authored[i].find(c=>c.id===edge.curveId);assert(c,'unknown authored curve '+edge.curveId);
   if(c.kind==='circle'){assert.equal(edge.nativeReversed,false);return c;}
   return edge.nativeReversed?{...c,a:c.b,b:c.a}:c;
  });
  const circular=curves.length===1&&curves[0].kind==='circle';assert.equal(loop.vertices.length,circular?0:curves.length);
  loop.vertices.forEach((v,j)=>{assert.equal(v.source,j);assert.deepEqual(v.incidentCurveIds,[curves[(j+curves.length-1)%curves.length].id,curves[j].id].sort());});
  return curves;
 });
 return{...request,region:{...request.region,outer:normalized[0],holes:normalized.slice(1)}};
}
export function inspectAncestry(request,catalog,provenance){
 const local=o=>{assert.equal(o.version,1);assert.equal(o.scope,'response-local');assert.equal(o.persistentIds,false);assert.doesNotMatch(JSON.stringify(o),/"(?:ptr|ref|edgeRef|handle)"\s*:/);};
 local(catalog);local(provenance);assert.equal(catalog.valid,true);assert.equal(catalog.solidCount,1);
 const maps={};for(const kind of['vertices','edges','faces']){
  const xs=catalog[kind];assert.ok(Array.isArray(xs));maps[kind]=new Map();
  xs.forEach((x,i)=>{assert.equal(x.index,i+1);assert.ok(!maps[kind].has(x.index));maps[kind].set(x.index,x);});
  assert.equal(provenance.resultCounts[kind],xs.length);
 }
 const get=(kind,i)=>{assert.ok(Number.isInteger(i)&&i>0,kind+' index');const x=maps[kind].get(i);assert.ok(x,kind+' missing '+i);return x;};
 const f=request.frame,delta=f.z.map(n=>n*request.depth),world=p=>f.origin.map((v,i)=>v+f.x[i]*p[0]+f.y[i]*p[1]),shift=p=>p.map((v,i)=>v+delta[i]);
 const face=(index,points)=>{const s=get('faces',index);assert.equal(s.type,'plane');for(const p of points)near(dot(vec(p,s.analytic.origin),s.analytic.normal),0);return s;};
 const onCap=(edge,points)=>{const e=get('edges',edge);assert.equal(e.type,'line');assert.equal(e.degenerated,false);assert.equal(e.vertices.length,2);const ps=e.vertices.map(i=>get('vertices',i).point);assert.ok(points.every(p=>ps.some(q=>norm(vec(p,q))<1e-7)));};
 const wireEdges=index=>new Set(get('faces',index).wires.flat().map(use=>use.edge));
 const caps=provenance.caps;assert.notEqual(caps.firstFace,caps.lastFace);face(caps.firstFace,[f.origin]);face(caps.lastFace,[shift(f.origin)]);
 const firstWire=wireEdges(caps.firstFace),lastWire=wireEdges(caps.lastFace),capEdges=new Set(),sideFaces=new Set(),connectors=new Set(),capVertices=new Set();
 const loops=[request.region.outer,...request.region.holes];assert.equal(provenance.sourceLoops.length,loops.length);let sourceEdges=0,sourceVertices=0,circleLoops=0;
 const add=(set,value)=>{assert.ok(!set.has(value),'duplicate lineage target '+value);set.add(value);};
 loops.forEach((curves,li)=>{
  const source=provenance.sourceLoops[li];assert.equal(source.loop,li);assert.equal(source.edges.length,curves.length);
  const circular=curves.length===1&&curves[0].kind==='circle';assert.equal(source.vertices.length,circular?0:curves.length);sourceEdges+=curves.length;if(circular)circleLoops++;else sourceVertices+=curves.length;
  source.edges.forEach((link,i)=>{
   assert.equal(link.source,i);assert.notEqual(link.firstEdge,link.lastEdge);add(capEdges,link.firstEdge);add(capEdges,link.lastEdge);add(sideFaces,link.sweptFace);
   assert.ok(firstWire.has(link.firstEdge));assert.ok(lastWire.has(link.lastEdge));assert.ok(![caps.firstFace,caps.lastFace].includes(link.sweptFace));
   const sides=wireEdges(link.sweptFace);assert.ok(sides.has(link.firstEdge)&&sides.has(link.lastEdge));
   if(circular){const c=curves[0],base=world(c.center),last=shift(base);for(const [index,center]of[[link.firstEdge,base],[link.lastEdge,last]]){
     const edge=get('edges',index);assert.equal(edge.type,'circle');near(edge.analytic.radius,c.radius);samePoint(edge.analytic.center,center);near(Math.abs(dot(edge.analytic.axis,f.z)),1);near(edge.range[1]-edge.range[0],2*Math.PI);
    }const side=get('faces',link.sweptFace);assert.equal(side.type,'cylinder');near(side.analytic.radius,c.radius);near(norm(cross(vec(side.analytic.origin,base),f.z)),0);near(Math.abs(dot(side.analytic.axis,f.z)),1);
   }else{const c=curves[i],a=world(c.a),b=world(c.b);onCap(link.firstEdge,[a,b]);onCap(link.lastEdge,[shift(a),shift(b)]);face(link.sweptFace,[a,b,shift(a),shift(b)]);}
  });
  source.vertices.forEach((link,i)=>{
   assert.equal(link.source,i);assert.notEqual(link.firstVertex,link.lastVertex);add(capVertices,link.firstVertex);add(capVertices,link.lastVertex);add(connectors,link.sweptEdge);
   const p=world(curves[i].a);samePoint(get('vertices',link.firstVertex).point,p);samePoint(get('vertices',link.lastVertex).point,shift(p));onCap(link.sweptEdge,[p,shift(p)]);
   const previous=source.edges[(i+curves.length-1)%curves.length],next=source.edges[i];assert.ok(wireEdges(previous.sweptFace).has(link.sweptEdge));assert.ok(wireEdges(next.sweptFace).has(link.sweptEdge));
  });
 });
 for(const i of connectors)assert.ok(!capEdges.has(i));assert.equal(sideFaces.size+2,catalog.faces.length);
 assert.equal(catalog.edges.length,2*sourceEdges+sourceVertices+circleLoops);assert.equal(catalog.vertices.length,2*sourceVertices+2*circleLoops);
 const unmappedEdges=catalog.edges.filter(e=>!capEdges.has(e.index)&&!connectors.has(e.index));assert.equal(unmappedEdges.length,circleLoops);
 for(const edge of unmappedEdges){assert.equal(edge.type,'line');const uses=catalog.faces.flatMap(f=>f.wires.flat()).filter(u=>u.edge===edge.index);assert.ok(uses.some(u=>u.seam===true),'unattributed edge must be genuine circle seam');const ps=edge.vertices.map(i=>get('vertices',i).point);near(norm(vec(ps[0],ps[1])),request.depth);near(norm(cross(vec(ps[0],ps[1]),f.z)),0);}
 return{sourceEdges,sourceVertices,circleLoops,capEdges:capEdges.size,sweptFaces:sideFaces.size,authoredConnectors:connectors.size,unattributedCircleSeams:unmappedEdges.length,responseLocal:true,persistentIds:false};
}
