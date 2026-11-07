import assert from 'node:assert/strict';
import {inspectSourceBindings,inspectAncestry} from '../polygon-profile-v3-browser/oracle.mjs';
const same=(a,b)=>assert.deepEqual(a,b),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),delta=(a,b)=>a.map((v,i)=>v-b[i]);
export const near=(a,b,t=1e-6)=>assert(Number.isFinite(a)&&Math.abs(a-b)<=Math.max(t,Math.abs(b)*1e-10),`${a} != ${b}`);
const world=(f,p)=>f.origin.map((v,i)=>v+f.x[i]*p[0]+f.y[i]*p[1]+f.z[i]*p[2]);
const local=(f,p)=>[dot(delta(p,f.origin),f.x),dot(delta(p,f.origin),f.y),dot(delta(p,f.origin),f.z)];
function bounds(f){const ps=[];for(const x of[0,f.width])for(const y of[0,f.height])for(const z of[0,f.depth])ps.push(world(f.source.frame,[x,y,z]));return{min:[0,1,2].map(i=>Math.min(...ps.map(p=>p[i]))),max:[0,1,2].map(i=>Math.max(...ps.map(p=>p[i])))};}
const centers=f=>[[f.width/2,f.height/2],[8,8],[f.width-8,8],[f.width-8,f.height-8],[8,f.height-8]];
function checkPlan(s,f,featureId,catalog){
 assert.equal(s.status,'available');const p=s.plan;assert.equal(p.version,2);assert.equal(p.featureId,featureId);assert.equal(p.scope,'authored-source');assert(!Object.hasOwn(p,'regionId'));same(p.sourceContexts,[{kind:'sketch-profile',featureId:10,regionId:f.source.region.id}]);assert.equal(p.vertices.length,0);
 for(const kind of['edges','faces']){const ids=new Set();for(const x of p[kind]){assert.equal(x.originFeatureId,10);assert(!ids.has(x.id));ids.add(x.id);assert(!Object.hasOwn(x,'nativeIndex'));assert(!Object.hasOwn(x,'index'));}}
 for(const [kind,plural]of[['vertex','vertices'],['edge','edges'],['face','faces']]){const expected=catalog[plural].length-p[plural].length,rows=p.unresolved.filter(u=>u.kind===kind&&u.reason==='UNCLAIMED_KERNEL_ENTITY');assert.equal(rows.length,expected?1:0);if(expected)assert.equal(rows[0].count,expected);}
 return p;
}
function checkShape(s,f,{holes=0,fillet=0,chamfer=0,featureId}){
 const e=s.result.evidence,d=f.depth,removed=holes?Math.PI*d*(holes===1?25:41):0,expected=f.width*f.height*d-removed-2*d*fillet*fillet*(1-Math.PI/4)-d*chamfer*chamfer;
 assert(e.nativeValidity.valid);assert.equal(e.solidCount,1);near(e.nativeVolume,expected);const b=bounds(f);for(const k of['min','max'])b[k].forEach((v,i)=>near(e.nativeBounds[k][i],v));
 const c=s.catalog;assert(c.valid);assert.equal(c.scope,'response-local');assert.equal(c.persistentIds,false);assert.equal(c.solidCount,1);assert(c.faces.every(x=>['plane','cylinder'].includes(x.type)));
 const treated=(fillet?2:0)+(chamfer?2:0);assert.equal(c.faces.length,6+holes+treated);assert.equal(c.edges.length,12+3*holes+3*treated);assert.equal(c.vertices.length,8+2*holes+2*treated);
 const cs=c.faces.filter(x=>x.type==='cylinder'),wanted=centers(f).slice(0,holes).map((center,i)=>({center,radius:i?2:5}));if(fillet)wanted.push({center:[fillet,fillet],radius:fillet},{center:[f.width-fillet,f.height-fillet],radius:fillet});assert.equal(cs.length,wanted.length);
 for(const w of wanted){const hits=cs.filter(c=>{const p=local(f.source.frame,c.analytic.origin);return Math.abs(c.analytic.radius-w.radius)<1e-6&&Math.hypot(p[0]-w.center[0],p[1]-w.center[1])<1e-6;});assert.equal(hits.length,1,JSON.stringify(w));near(Math.abs(dot(hits[0].analytic.axis,f.source.frame.z)),1);}
 assert(s.mesh.triangleCount>0);assert.equal(s.mesh.coordinates.length,s.mesh.triangleCount*9);assert(s.mesh.coordinates.every(Number.isFinite));for(const p of s.points??[]){same(p.point,world(f.source.frame,p.local));assert.equal(p.actual.classification,p.expected,JSON.stringify(p));}
 return checkPlan(s.selection,f,featureId,c);
}
const pick=s=>({catalog:s.catalog,selection:s.selection,mesh:s.mesh});
const connector=(p,pair)=>p.edges.filter(e=>e.role==='connector'&&JSON.stringify(e.incidentCurveIds)===JSON.stringify([...pair].sort()));
export function checkFixture(row,f,filletPairs,chamferPairs){
 assert(!row.error,JSON.stringify(row.error));assert(row.sourcePreserved);assert(row.requestsPreserved);
 const capability=row.capabilities.operations.find(o=>o.id==='solid.holes.through'&&o.version===1);assert(capability);
 const base=checkShape(row.base,f,{featureId:10}),center=checkShape(row.center,f,{holes:1,featureId:20}),corners=checkShape(row.corners,f,{holes:5,featureId:21}),fillet=checkShape(row.fillet,f,{holes:5,fillet:3,featureId:40}),chamfer=checkShape(row.chamfer,f,{holes:5,fillet:3,chamfer:1,featureId:41});
 assert.equal(row.base.result.constructionProvenance.status,'available');const normalized=inspectSourceBindings(f.source,row.base.result.constructionProvenance);assert.equal(inspectAncestry(normalized,row.base.catalog,row.base.result.constructionProvenance.data).authoredConnectors,4);
 for(const pair of[...filletPairs,...chamferPairs]){const first=connector(base,pair);assert.equal(first.length,1);for(const p of[center,corners]){const current=connector(p,pair);assert.equal(current.length,1);assert.equal(current[0].id,first[0].id);}}
 // Hole surfaces and rims are native geometry, not authored naming claims.
 for(const p of[center,corners]){assert(p.faces.every(x=>x.geometry==='plane'));assert.equal(p.faces.length,6);assert.equal(p.edges.length,12);}
 assert.equal(fillet.faces.filter(x=>x.role==='blend').length,2);assert.equal(chamfer.faces.filter(x=>x.role==='blend').length,4);
 for(const pair of chamferPairs)assert.equal(connector(fillet,pair)[0].id,connector(base,pair)[0].id);
 for(const u of fillet.unresolved.filter(x=>Object.hasOwn(x,'id')))same(chamfer.unresolved.find(x=>x.id===u.id),u);
 same(pick(row.base),row.baseAfter);same(pick(row.center),row.centerAfter);same(pick(row.corners),row.cornersAfter);same(pick(row.fillet),row.filletAfter);
 assert.equal(row.center.result.op,'solid.holes.through');assert.equal(row.corners.result.op,'solid.holes.through');
 assert.equal(row.staleSource.outcome?.code,'INVALID_HANDLE');assert.equal(row.staleSource.posts,0);same(pick(row.staleSource.before),row.staleSource.after);row.disposed.forEach(e=>assert.equal(e?.code,'INVALID_HANDLE'));
 return{id:f.id,centerVolume:row.center.result.evidence.nativeVolume,finalVolume:row.chamfer.result.evidence.nativeVolume,nativePointChecks:row.center.points.length+row.corners.points.length+row.chamfer.points.length,sourceContexts:1,preservedInputs:4};
}
export function checkControls(controls,fixture){
 assert.equal(controls.length,5);const expected={'wrong-producer':['INVALID_SELECTION_BINDING'],'wrong-region':['STALE_SOURCE','INVALID_SELECTION_BINDING'],'wrong-source-handle':['INVALID_SELECTION_BINDING'],'overlap':['HOLES_OVERLAP'],'outside':['HOLE_OUTSIDE_PROFILE']};
 for(const row of controls){assert(!row.error,JSON.stringify(row.error));assert(expected[row.id].includes(row.outcome?.code),JSON.stringify({id:row.id,outcome:row.outcome}));assert(row.requestPreserved);same(row.before,row.after);same(row.before,row.sourceAfterHealthy);if(row.alternateBefore)same(row.alternateBefore,row.alternateAfter);checkShape(row.healthy,fixture,{holes:1,featureId:20});}
 return controls.map(r=>({id:r.id,code:r.outcome.code,healthyVolume:r.healthy.result.evidence.nativeVolume}));
}
export function checkWork(workers,fixtures){
 for(let i=0;i<fixtures.length;i++){
  const rows=workers[i].work;assert.equal(rows.length,2);for(const [j,row]of rows.entries()){same(row.hole,j?fixtures[i].cornersIntent:fixtures[i].centerIntent);assert.equal(row.work.version,1);assert.equal(row.work.nativeResults,j?8:2);assert.equal(row.work.resultTriangles.length,j?8:2);row.work.resultTriangles.forEach(n=>assert(Number.isSafeInteger(n)&&n>0));}
 }
 assert(workers.every(w=>w.terminated));
}
