import {captureArrangementBoundary} from '../extrusion/selectedArrangementDescriptor.mjs';
// Worker-side bounded observations; indices are response-local, never IDs.
const fail=()=>{throw Object.assign(Error('Invalid native topology observation'),{code:'ENGINE_FAILURE'});};
const record=(v,keys)=>{
 if(!v||typeof v!=='object'||Array.isArray(v)||Reflect.ownKeys(v).length!==keys.length)fail();
 for(const k of keys){const d=Object.getOwnPropertyDescriptor(v,k);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail();}return v;
};
const list=(v,max)=>{if(!Array.isArray(v)||v.length>max||Reflect.ownKeys(v).length!==v.length+1)fail();for(let i=0;i<v.length;i++)if(!Object.hasOwn(v,i))fail();return v;};
const count=(n,max,min=0)=>{if(!Number.isSafeInteger(n)||n<min||n>max)fail();return n;};
const point=v=>{list(v,3);if(v.length!==3||v.some(n=>typeof n!=='number'||!Number.isFinite(n)||Math.abs(n)>4e6))fail();};
const direction=v=>{point(v);if(Math.abs(Math.hypot(...v)-1)>1e-8)fail();};
const positive=n=>{if(typeof n!=='number'||!Number.isFinite(n)||n<=0||n>4e6)fail();};
const orientation=v=>{if(!['FORWARD','REVERSED','INTERNAL','EXTERNAL'].includes(v))fail();};
// Authored endpoint occurrences, not coordinates or Native catalog slots.
// Producer canonicalization and strict descendant capture share one grammar.
function prismEndpointRoles(value,canonicalize){
 if(!Array.isArray(value)||value.length!==2||Reflect.ownKeys(value).length!==3)fail();
 const rows=[0,1].map(i=>{const d=Object.getOwnPropertyDescriptor(value,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))fail();const r=record(d.value,['curveId','endpoint']);if(typeof r.curveId!=='string'||!r.curveId||r.curveId.length>256||!['a','b'].includes(r.endpoint))fail();return{curveId:r.curveId,endpoint:r.endpoint};});
 const compare=(a,b)=>a.curveId<b.curveId?-1:a.curveId>b.curveId?1:a.endpoint<b.endpoint?-1:a.endpoint>b.endpoint?1:0;
 if(compare(rows[0],rows[1])===0)fail();if(canonicalize)rows.sort(compare);else if(compare(rows[0],rows[1])>=0)fail();return Object.freeze(rows.map(Object.freeze));
}
export function canonicalPrismEndpointRoles(value){return prismEndpointRoles(value,true);}
export function capturePrismEndpointRoles(value){return prismEndpointRoles(value,false);}
// The currently admitted connector slice has two distinct source curves.
// Full-Arc periodic seam roles remain private provenance, not public selectors.
export function capturePrismConnectorEndpointRoles(value,incidentCurveIds){
 const roles=capturePrismEndpointRoles(value);if(!Array.isArray(incidentCurveIds)||incidentCurveIds.length!==2||Reflect.ownKeys(incidentCurveIds).length!==3||roles[0].curveId===roles[1].curveId)fail();
 for(let i=0;i<2;i++){const d=Object.getOwnPropertyDescriptor(incidentCurveIds,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value')||d.value!==roles[i].curveId)fail();}return roles;
}
export function validateOwnedTopology(value){
 const v=record(value,['version','scope','persistentIds','valid','solidCount','vertices','edges','faces']);
 if(v.version!==1||v.scope!=='response-local'||v.persistentIds!==false||v.valid!==true)fail();count(v.solidCount,256);
 list(v.vertices,1024);list(v.edges,512);list(v.faces,256);
 for(let i=0;i<v.vertices.length;i++){const row=record(v.vertices[i],['index','point']);if(row.index!==i+1)fail();point(row.point);}
 for(let i=0;i<v.edges.length;i++){
  const e=v.edges[i];record(e,e?.degenerated===true?['index','orientation','vertices','degenerated','type','analytic','support']:['index','orientation','vertices','degenerated','type','range','analytic','support']);
  if(e.index!==i+1||typeof e.degenerated!=='boolean')fail();orientation(e.orientation);list(e.vertices,2);if(e.vertices.length!==2)fail();e.vertices.forEach(n=>count(n,v.vertices.length));
  if(e.degenerated){if(e.type!=='degenerate'||e.analytic!==null||e.support!=='unsupported')fail();continue;}
  list(e.range,2);if(e.range.length!==2||e.range.some(n=>typeof n!=='number'||!Number.isFinite(n))||e.range[0]>e.range[1])fail();
  if(e.type==='line'){record(e.analytic,['origin','direction']);point(e.analytic.origin);direction(e.analytic.direction);}
  else if(e.type==='circle'){record(e.analytic,['center','axis','x','y','radius']);point(e.analytic.center);for(const k of ['axis','x','y'])direction(e.analytic[k]);positive(e.analytic.radius);}
  else if(!['ellipse','hyperbola','parabola','bezier','bspline','offset','other'].includes(e.type)||e.analytic!==null)fail();
  if(e.support!==(['line','circle'].includes(e.type)?'analytic-descriptor':'unsupported'))fail();
 }
 let wires=0,uses=0;
 for(let i=0;i<v.faces.length;i++){
  const f=record(v.faces[i],['index','orientation','type','analytic','support','wires']);if(f.index!==i+1)fail();orientation(f.orientation);
  if(f.type==='plane'){record(f.analytic,['origin','normal']);point(f.analytic.origin);direction(f.analytic.normal);}
  else if(f.type==='cylinder'){record(f.analytic,['origin','axis','radius']);point(f.analytic.origin);direction(f.analytic.axis);positive(f.analytic.radius);}
  else if(!['cone','sphere','torus','bezier','bspline','revolution','extrusion','offset','other'].includes(f.type)||f.analytic!==null)fail();
  if(f.support!==(['plane','cylinder'].includes(f.type)?'analytic-descriptor':'unsupported'))fail();
  for(const wire of list(f.wires,4096)){if(++wires>4096)fail();for(const use of list(wire,4096)){if(++uses>4096)fail();record(use,['edge','orientation','seam']);count(use.edge,v.edges.length,1);orientation(use.orientation);if(typeof use.seam!=='boolean')fail();}}
 }
 return v;
}
export function validatePrismProvenance(value,topology,prepared){
 if(value?.status==='unavailable'){
  record(value,['status','reason']);if(!['PROFILE_PROVENANCE_UNSUPPORTED','PROFILE_PROVENANCE_RESOURCE_LIMIT','PROFILE_PROVENANCE_FAILED'].includes(value.reason))fail();return value;
 }
 record(value,['status','data']);if(value.status!=='available')fail();
 const v=record(value.data,['version','scope','persistentIds','caps','sourceLoops','resultCounts']);
 if(v.version!==1||v.scope!=='response-local'||v.persistentIds!==false)fail();
 record(v.resultCounts,['edges','faces','vertices']);for(const k of ['edges','faces','vertices'])if(v.resultCounts[k]!==topology[k].length)fail();
 record(v.caps,['firstFace','lastFace']);for(const n of Object.values(v.caps))count(n,topology.faces.length,1);if(v.caps.firstFace===v.caps.lastFace)fail();
 list(v.sourceLoops,129);if(v.sourceLoops.length!==prepared.loops.length)fail();
 const capEdges=new Set(),sideFaces=new Set(),connectors=new Set(),capVertices=new Set();
 for(let i=0;i<v.sourceLoops.length;i++){
  const row=record(v.sourceLoops[i],['loop','edges','vertices']),loop=prepared.loops[i],circle=loop.kind==='circle',n=circle?1:loop.kind==='analytic'?loop.curves.length:loop.vertices.length;
  if(row.loop!==i)fail();list(row.edges,512);list(row.vertices,512);if(row.edges.length!==n||row.vertices.length!==(circle?0:n))fail();
  for(let j=0;j<row.edges.length;j++){
   const e=record(row.edges[j],['source','firstEdge','lastEdge','sweptFace']);if(e.source!==j)fail();
   for(const id of [e.firstEdge,e.lastEdge]){count(id,topology.edges.length,1);if(capEdges.has(id))fail();capEdges.add(id);}
   count(e.sweptFace,topology.faces.length,1);if(sideFaces.has(e.sweptFace)||e.sweptFace===v.caps.firstFace||e.sweptFace===v.caps.lastFace)fail();sideFaces.add(e.sweptFace);
  }
  for(let j=0;j<row.vertices.length;j++){
   const p=record(row.vertices[j],['source','firstVertex','lastVertex','sweptEdge']);if(p.source!==j)fail();
   for(const id of [p.firstVertex,p.lastVertex]){count(id,topology.vertices.length,1);if(capVertices.has(id))fail();capVertices.add(id);}
   count(p.sweptEdge,topology.edges.length,1);if(connectors.has(p.sweptEdge))fail();connectors.add(p.sweptEdge);
  }
 }
 if([...connectors].some(n=>capEdges.has(n))||sideFaces.size+2!==topology.faces.length)fail();
 return value;
}
export function bindPrismSourceSlots(value,prepared){
 if(value.status!=='available')return value;
 const curves=[prepared.request.region.outer,...prepared.request.region.holes];
 const boundary=prepared.request.region.boundaryProvenance?captureArrangementBoundary(prepared.request.region.boundaryProvenance,prepared.request.region):null;
 const spans=boundary?new Map(boundary.descriptor.outerBoundaryRefs.map(r=>[r.id,r])):null;
 const equal=(a,b)=>a[0]===b[0]&&a[1]===b[1];
 const nativeSlotBindings=prepared.loops.map((loop,i)=>{
  if(loop.kind==='analytic'){
   list(loop.curves,512);list(curves[i],512);if(!loop.curves.length||loop.curves.length!==curves[i].length)fail();const sourceIds=new Set();for(let j=0;j<loop.curves.length;j++){
    const c=loop.curves[j];
    if(typeof c.id!=='string'||!c.id||c.id.length>256||sourceIds.has(c.id)||!['segment','arc'].includes(c.kind)||!['forward','reversed'].includes(c.orientation)||![c.a,c.b].every(p=>Array.isArray(p)&&p.length===2&&p.every(n=>typeof n==='number'&&Number.isFinite(n))))fail();sourceIds.add(c.id);
    const originals=curves[i].filter(original=>original.id===c.id);if(originals.length!==1)fail();const original=originals[0],samePoint=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===2&&b.length===2&&a.every((n,k)=>Object.is(n,b[k]));
    if(c.kind!==original.kind||!samePoint(c.a,original.a)||!samePoint(c.b,original.b)||c.kind==='arc'&&(c.branch!==original.branch||!samePoint(c.center,original.center)))fail();
    if(c.kind==='arc'&&(!['proper-ccw','full-ccw'].includes(c.branch)||c.branch==='full-ccw'&&(loop.curves.length!==1||!equal(c.a,c.b))))fail();
   }
   for(let j=0;j<loop.curves.length;j++){const c=loop.curves[j],next=loop.curves[(j+1)%loop.curves.length];if(!equal(c.orientation==='forward'?c.b:c.a,next.orientation==='forward'?next.a:next.b))fail();}
   const edges=loop.curves.map((c,j)=>({source:j,curveId:c.id,nativeReversed:c.orientation==='reversed'}));
   return{loop:i,edges,vertices:edges.map((_,j)=>({source:j,incidentCurveIds:[edges[(j+edges.length-1)%edges.length].curveId,edges[j].curveId].sort(),endpointRoles:canonicalPrismEndpointRoles([{curveId:loop.curves[(j+edges.length-1)%edges.length].id,endpoint:loop.curves[(j+edges.length-1)%edges.length].orientation==='forward'?'b':'a'},{curveId:loop.curves[j].id,endpoint:loop.curves[j].orientation==='forward'?'a':'b'}])}))};
  }
  if(loop.kind==='circle')return{loop:i,edges:[{source:0,curveId:curves[i][0].id,nativeReversed:false}],vertices:[]};
  const edges=loop.vertices.map((a,j)=>{
   const b=loop.vertices[(j+1)%loop.vertices.length],matches=curves[i].filter(c=>c.kind==='segment'&&(equal(c.a,a)&&equal(c.b,b)||equal(c.a,b)&&equal(c.b,a)));
   if(matches.length!==1)fail();const c=matches[0];if(spans){if(!spans.has(c.id))fail();return{source:j,boundaryRef:spans.get(c.id),nativeReversed:!equal(c.a,a)};}return{source:j,curveId:c.id,nativeReversed:!equal(c.a,a)};
  });
  return{loop:i,edges,vertices:edges.map((_,j)=>spans?{source:j,incidentBoundaryRefs:[edges[(j+edges.length-1)%edges.length].boundaryRef,edges[j].boundaryRef].sort((a,b)=>a.id<b.id?-1:1)}:{source:j,incidentCurveIds:[edges[(j+edges.length-1)%edges.length].curveId,edges[j].curveId].sort()})};
 });
 return{...value,sourceBinding:{scope:'solved-request',regionId:prepared.request.region.id,nativeSlotBindings,...(boundary?{boundaryKind:'source-spans'}:{})}};
}
