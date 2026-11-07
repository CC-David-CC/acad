import assert from 'node:assert/strict';
import {inspectSourceBindings,inspectAncestry} from '../polygon-profile-v3-browser/oracle.mjs';
export const near=(a,b,t=1e-7)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=Math.max(t,Math.abs(b)*1e-10),`${a} != ${b}`);
const same=(a,b)=>assert.deepEqual(a,b);
export function checkPlan(plan,featureId){
 assert.equal(plan.version,1);assert.equal(plan.featureId,featureId);assert.equal(plan.scope,'authored-source');
 for(const kind of ['edges','faces']){assert(Array.isArray(plan[kind]));const ids=new Set();for(const item of plan[kind]){assert.equal(typeof item.id,'string');assert(!ids.has(item.id));ids.add(item.id);assert(!Object.hasOwn(item,'index'));assert(!Object.hasOwn(item,'nativeIndex'));}}
}
export function checkChain(row,fixture,pairs){
 assert(!row.error,JSON.stringify(row.error));assert(row.sourcePreserved);assert(row.inputPreserved);assert(row.requestsPreserved);
 const {width:w,height:h,depth:d}=fixture,V=w*h*d,cut=2*d*9*(1-Math.PI/4);
 assert.equal(row.base.result.constructionProvenance.status,'available');
 const nativeSource=inspectSourceBindings(fixture.request,row.base.result.constructionProvenance);
 const sourceProof=inspectAncestry(nativeSource,row.base.catalog,row.base.result.constructionProvenance.data);
 assert.equal(sourceProof.authoredConnectors,4);
 const shapes=[['base',V,0],['fillet',V-cut,2],['chamfer',V-cut-d,2]];
 for(const [name,volume,cylinders] of shapes){
  const s=row[name];assert(s.result.evidence.nativeValidity.valid);assert.equal(s.result.evidence.solidCount,1);near(s.result.evidence.nativeVolume,volume);for(const [key,values]of Object.entries({min:[0,0,0],max:[w,h,d]}))values.forEach((v,i)=>near(s.result.evidence.nativeBounds[key][i],v));
  assert.equal(s.catalog.scope,'response-local');assert.equal(s.catalog.persistentIds,false);assert(s.catalog.valid);assert.equal(s.catalog.solidCount,1);
  const cs=s.catalog.faces.filter(f=>f.type==='cylinder');assert.equal(cs.length,cylinders);
  if(cylinders){for(const c of cs){near(c.analytic.radius,3);near(Math.abs(c.analytic.axis[2]),1);}const centers=cs.map(c=>c.analytic.origin.slice(0,2)).sort((a,b)=>a[0]-b[0]);near(centers[0][0],3);near(centers[0][1],3);near(centers[1][0],w-3);near(centers[1][1],h-3);}
  assert(s.catalog.faces.every(f=>['plane','cylinder'].includes(f.type)));
  assert(s.mesh.triangleCount>0);assert(s.mesh.coordinates.every(Number.isFinite));assert.equal(s.mesh.coordinates.length,s.mesh.triangleCount*9);
  checkPlan(s.plan,name==='base'?101:name==='fillet'?102:103);
  for(const p of s.points)assert.equal(p.actual.classification,p.expected,`${fixture.id}/${name}: ${JSON.stringify(p)}`);
 }
 // All four connector IDs begin as actual construction-source bindings. Only
 // the two untouched connectors are required to survive each intermediate.
 const connector=(plan,pair)=>plan.edges.filter(e=>e.role==='connector'&&JSON.stringify(e.incidentCurveIds)===JSON.stringify([...pair].sort()));
 for(const pair of [...pairs.fillet,...pairs.chamfer])assert.equal(connector(row.base.plan,pair).length,1);
 for(const pair of pairs.chamfer){const a=connector(row.base.plan,pair),b=connector(row.fillet.plan,pair);assert.equal(b.length,1);same(b[0].id,a[0].id);}
 same(row.fillet.selected,row.base.plan.edges.filter(e=>pairs.fillet.some(p=>JSON.stringify(e.incidentCurveIds)===JSON.stringify([...p].sort()))&&e.role==='connector').map(e=>e.id));
 same(row.chamfer.selected,row.fillet.plan.edges.filter(e=>pairs.chamfer.some(p=>JSON.stringify(e.incidentCurveIds)===JSON.stringify([...p].sort()))&&e.role==='connector').map(e=>e.id));
 for(const [stage,expected]of [['fillet',2],['chamfer',4]]){
  const blends=row[stage].plan.faces.filter(f=>f.role==='blend');assert.equal(blends.length,expected);
  for(const [source,kind,featureId]of [[row.fillet.selected,'fillet',102],...(stage==='chamfer'?[[row.chamfer.selected,'chamfer-equal',103]]:[])]){
   for(const id of source){const blend=blends.filter(f=>f.sourceEdgeId===id&&f.kind===kind);assert.equal(blend.length,1);assert.equal(blend[0].geometry,kind==='fillet'?'cylinder':'plane');assert(!row[stage].plan.edges.some(e=>e.id===id));const unresolved=row[stage].plan.unresolved.filter(u=>u.id===id);assert.equal(unresolved.length,1);assert.equal(unresolved[0].kind,'edge');assert.equal(unresolved[0].featureId,featureId);assert(['NO_DESCENDANT','MULTIPLE_DESCENDANTS','MERGED_DESCENDANT'].includes(unresolved[0].reason));}
  }
 }
 // Retained observations, including exact transferred display coordinates,
 // independently bind the before/after preservation statement.
 same(row.baseBefore,row.baseAfter);same(row.filletBefore,row.filletAfter);
 assert(row.disposed.every(v=>v===true));assert(row.staleCodes.every(v=>v==='INVALID_HANDLE'));
 return {id:fixture.id,nativeVolume:row.chamfer.result.evidence.nativeVolume,cylinders:2,pointChecks:shapes.reduce((n,[k])=>n+row[k].points.length,0),preservedInputs:2};
}
