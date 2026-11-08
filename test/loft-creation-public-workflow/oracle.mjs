// Independent fixture arithmetic/source observations; no production geometry imports.
import a from 'node:assert/strict';
export const SOURCE_MM=1e-8, NATIVE_MM=1e-6, NATIVE_MM3=1e-6;
export const near=(x,y,t=SOURCE_MM)=>a(Number.isFinite(x)&&Math.abs(x-y)<=t,`${x} differs from ${y}; budget ${t}`);
const one=(xs,label)=>{a.equal(xs.length,1,label);return xs[0];};
export function derive(native,b,dimensions,inspections) {
  a.deepEqual(native.history.map(r=>r.type),['PLANE','PLANE','WORKER_SELECTED_PROFILE_LOFT_V1']);
  const p=native.history[2].params;
  a.deepEqual(Object.keys(p).sort(),['version','unit','engine','engineRevision','featureId','sections','construction','bodyPolicy'].sort());
  a.equal(p.version,1);a.equal(p.unit,'millimeter');a.equal(p.engine,'occ');a.equal(p.engineRevision,b.engineRevision);
  a.equal(p.featureId,b.featureId);a.equal(p.construction,'ruled-solid');a.equal(p.bodyPolicy,'separate');a.deepEqual(p.sections,b.sections);
  if(b.authored)a.deepEqual(p,b.authored);
  a.equal(native.sketches.length,2);
  const source=[],sections=b.faceIds.map((faceId,n)=>{
    const plane=native.history[b.planes[n].index];a.equal(plane.type,'PLANE');a.equal(Number(plane.params.featureId),b.planes[n].featureId);
    a.equal(plane.params.orientation,'XY');a.equal(plane.params.datum,null);a.equal(plane.params.depth,n?dimensions.depth:0);
    const raw=one(native.sketches.filter(s=>s.id===faceId),'original source'),s=JSON.parse(raw.source);source.push(s);
    a.equal(s.version,3);a.equal(s.objects.length,4);a.equal(s.stages.length,1);a.equal(s.stages[0].constraints.length,11);a.equal(s.stages[0].generators.length,0);
    a(Object.values(s.boundary).every(v=>Array.isArray(v)&&!v.length));
    a.deepEqual(s.metadata.boundaryFrame,{origin:[0,0,plane.params.depth],x:[1,0,0],y:[0,1,0],z:[0,0,1]});
    a.deepEqual(s.objects.map(o=>o.id).sort(),b.curveIds[n].slice().sort());
    const vertices=s.objects.flatMap(o=>{a.equal(o.type,'Segment');a.equal(o.role,null);a.equal(o.stage,0);return[o.data.a,o.data.b];});
    const lo=[Math.min(...vertices.map(p=>p.x)),Math.min(...vertices.map(p=>p.y))],hi=[Math.max(...vertices.map(p=>p.x)),Math.max(...vertices.map(p=>p.y))];
    const width=n?50:dimensions.width,height=n?25:50,origin=n?[-25,-12.5]:[-50,-25];
    near(lo[0],origin[0]);near(lo[1],origin[1]);near(hi[0]-lo[0],width);near(hi[1]-lo[1],height);
    const corners=[[lo[0],lo[1]],[hi[0],lo[1]],[hi[0],hi[1]],[lo[0],hi[1]]],counts=[0,0,0,0],edges=[];
    for(const o of s.objects){const ends=[o.data.a,o.data.b].map(p=>{const at=corners.findIndex(q=>Math.abs(q[0]-p.x)<=SOURCE_MM&&Math.abs(q[1]-p.y)<=SOURCE_MM);a(at>=0);counts[at]++;return at;});a.equal((ends[0]+1)%4,ends[1],'original authored directed boundary branch');edges.push(ends[0]);}
    a.deepEqual(counts,[2,2,2,2]);a.deepEqual(edges.sort(),[0,1,2,3]);
    const seam=one(inspections[n].points.filter(p=>p.id===b.sections[n].seam.pointId),'actual seam point');
    a.equal(seam.parentId,b.seamCurveIds[n]);a(b.curveIds[n].includes(seam.parentId));near(seam.x,lo[0]);near(seam.y,lo[1]);
    const parent=one(s.objects.filter(o=>o.id===seam.parentId),'actual seam parent');near(parent.data.a.x,lo[0]);near(parent.data.a.y,lo[1]);near(parent.data.b.x,hi[0]);near(parent.data.b.y,lo[1]);
    return{min:lo,max:hi,z:plane.params.depth,width:hi[0]-lo[0],height:hi[1]-lo[1],corners};
  });
  const [s,t]=sections,h=t.z-s.z;a(h>0);const w0=s.width,w1=t.width,h0=s.height,h1=t.height;
  const volume=h*(2*w0*h0+w0*h1+w1*h0+2*w1*h1)/6;
  const min=[Math.min(s.min[0],t.min[0]),Math.min(s.min[1],t.min[1]),s.z],max=[Math.max(s.max[0],t.max[0]),Math.max(s.max[1],t.max[1]),t.z];
  const band=u=>({left:(1-u)*s.min[0]+u*t.min[0],right:(1-u)*s.max[0]+u*t.max[0],bottom:(1-u)*s.min[1]+u*t.min[1],top:(1-u)*s.max[1]+u*t.max[1],z:s.z+u*h});
  const m=band(.5),c=[(m.left+m.right)/2,(m.bottom+m.top)/2],b0=[(s.min[0]+s.max[0])/2,(s.min[1]+s.max[1])/2],b1=[(t.min[0]+t.max[0])/2,(t.min[1]+t.max[1])/2];
  const probes=[{point:[...c,m.z],classification:'inside'},{point:[(c[0]+m.right)/2,c[1],m.z],classification:'inside'},
    {point:[m.right,c[1],m.z],classification:'boundary'},{point:[m.right+1,c[1],m.z],classification:'outside'},
    {point:[...c,t.z+1],classification:'outside'},{point:[...b0,s.z],classification:'boundary'},
    {point:[(m.right+c[0])/2,(m.top+c[1])/2,m.z],classification:'inside'},
    {point:[s.max[0]-1,(band(.9).bottom+band(.9).top)/2,band(.9).z],classification:'outside'},
    {point:[...b1,t.z],classification:'boundary'},{point:[...b0,s.z-1],classification:'outside'}];
  a(probes[7].point[0]>band(.9).right+SOURCE_MM,'frozen taper discriminator must stay outside');
  return{source,sections,volume,bounds:{min,max},probes};
}
export function metrics(m,expected,build){a.equal(m.nativeValidity.valid,true);a.equal(m.resultKind,'single-solid');a.equal(m.solidCount,1);a.equal('sha256:'+m.runtime.jsSha256+':'+m.runtime.wasmSha256,build);near(m.nativeVolume,expected.volume,NATIVE_MM3);for(const side of['min','max'])expected.bounds[side].forEach((v,i)=>near(m.nativeBounds[side][i],v,NATIVE_MM));for(const[k,v]of Object.entries({solids:1,shells:1,faces:6,wires:6,edges:12,vertices:8}))a.equal(m.nativeTopology.counts[k],v);}
