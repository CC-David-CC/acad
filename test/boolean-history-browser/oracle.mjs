import assert from 'node:assert/strict';
import {inspectSourceBindings,inspectAncestry} from '../polygon-profile-v3-browser/oracle.mjs';
export const near=(a,b,t=1e-7)=>assert(Number.isFinite(a)&&Math.abs(a-b)<=Math.max(t,Math.abs(b)*1e-10),`${a} != ${b}`);
const kinds=['vertices','edges','faces'],same=(a,b)=>assert.deepEqual(a,b);
export function checkPlan(plan,featureId,contexts){
 assert.equal(plan.version,2);assert.equal(plan.featureId,featureId);assert.equal(plan.scope,'authored-source');
 assert(!Object.hasOwn(plan,'regionId'));same(plan.sourceContexts,contexts);
 const origins=new Set(contexts.map(c=>c.featureId)),ids=new Set();
 for(const kind of kinds){assert(Array.isArray(plan[kind]));for(const item of plan[kind]){assert.equal(typeof item.id,'string');assert(!ids.has(item.id));ids.add(item.id);assert(origins.has(item.originFeatureId));assert(!Object.hasOwn(item,'index'));assert(!Object.hasOwn(item,'nativeIndex'));}}
 for(const item of plan.unresolved){if(Object.hasOwn(item,'id')){assert(origins.has(item.originFeatureId));assert(!ids.has(item.id));ids.add(item.id);assert(Number.isInteger(item.featureId));}}
 assert.equal(plan.vertices.length,0,'This scoped corpus has no named vertex construction source');
}
const context=(featureId,regionId)=>({kind:'sketch-profile',featureId,regionId});
export function checkShape(shape,volume,solids,bounds,cylinders=null){
 const e=shape.result.evidence;assert(e.nativeValidity.valid);assert.equal(e.solidCount,solids);near(e.nativeVolume,volume);
 if(bounds===null)assert.equal(e.nativeBounds,null);else for(const k of ['min','max'])bounds[k].forEach((v,i)=>near(e.nativeBounds[k][i],v));
 const c=shape.catalog;assert.equal(c.scope,'response-local');assert.equal(c.persistentIds,false);assert(c.valid);assert.equal(c.solidCount,solids);
 for(const kind of kinds)c[kind].forEach((x,i)=>assert.equal(x.index,i+1));
 if(cylinders!==null)assert.equal(c.faces.filter(f=>f.type==='cylinder').length,cylinders);
 assert(c.faces.every(f=>['plane','cylinder'].includes(f.type)));
 assert.equal(shape.mesh.coordinates.length,shape.mesh.triangleCount*9);assert(shape.mesh.coordinates.every(Number.isFinite));
 if(solids===0){assert.equal(shape.mesh.triangleCount,0);for(const kind of kinds)assert.equal(c[kind].length,0);}else assert(shape.mesh.triangleCount>0);
 for(const p of shape.points??[])assert.equal(p.actual.classification,p.expected,JSON.stringify(p));
}
const connector=(plan,pair)=>plan.edges.filter(e=>e.role==='connector'&&JSON.stringify(e.incidentCurveIds)===JSON.stringify([...pair].sort()));
function sourceProof(request,state){assert.equal(state.result.constructionProvenance.status,'available');const normalized=inspectSourceBindings(request,state.result.constructionProvenance);return inspectAncestry(normalized,state.catalog,state.result.constructionProvenance.data);}
function cylinders(shape,expected){const actual=shape.catalog.faces.filter(f=>f.type==='cylinder');assert.equal(actual.length,expected.length);for(const want of expected){const hits=actual.filter(f=>Math.abs(f.analytic.radius-want.radius)<1e-7&&Math.hypot(f.analytic.origin[0]-want.center[0],f.analytic.origin[1]-want.center[1])<1e-7);assert.equal(hits.length,1,JSON.stringify(want));near(Math.abs(hits[0].analytic.axis[2]),1);}}
export function checkPlate(row,fixture,filletPairs,chamferPairs){
 assert(!row.error,JSON.stringify(row.error));assert(row.sourcePreserved);assert.equal(row.cuts.length,5);
 const {width:w,height:h,depth:d}=fixture,bounds={min:[0,0,0],max:[w,h,d]},contexts=[context(fixture.baseFeatureId,fixture.base.region.id)];
 checkShape(row.base,w*h*d,1,bounds,0);assert.equal(sourceProof(fixture.base,row.base).authoredConnectors,4);
 checkPlan(row.base.selection.plan,fixture.baseFeatureId,contexts);assert.equal(row.originalConnectors.length,4);
 for(const pair of [...filletPairs,...chamferPairs])assert.equal(connector(row.base.selection.plan,pair).length,1);
 for(const [i,cut]of row.cuts.entries()){
  const tool=fixture.tools[i];contexts.push(context(tool.featureId,tool.request.region.id));
  assert.equal(sourceProof(tool.request,cut.tool).circleLoops,1);checkPlan(cut.tool.selection.plan,tool.featureId,[context(tool.featureId,tool.request.region.id)]);
  checkShape(cut,w*h*d-(25+4*i)*Math.PI*d,1,bounds,i+1);cylinders(cut,fixture.tools.slice(0,i+1));
  checkPlan(cut.selection.plan,tool.cutFeatureId,contexts);same(cut.beforeA,cut.afterA);same(cut.beforeB,cut.afterB);
  for(const pair of [...filletPairs,...chamferPairs]){const original=connector(row.base.selection.plan,pair),current=connector(cut.selection.plan,pair);assert.equal(current.length,1);assert.equal(current[0].id,original[0].id);assert.equal(current[0].originFeatureId,fixture.baseFeatureId);}
 }
 const removed=2*d*9*(1-Math.PI/4),cutVolume=w*h*d-41*Math.PI*d;
 checkShape(row.fillet,cutVolume-removed,1,bounds,7);checkShape(row.chamfer,cutVolume-removed-d,1,bounds,7);
 cylinders(row.chamfer,[...fixture.tools,{center:[3,3],radius:3},{center:[w-3,h-3],radius:3}]);
 checkPlan(row.fillet.selection.plan,40,contexts);checkPlan(row.chamfer.selection.plan,41,contexts);
 same(row.fillet.selected,filletPairs.map(p=>connector(row.base.selection.plan,p)[0].id).sort((a,b)=>row.fillet.selected.indexOf(a)-row.fillet.selected.indexOf(b)));
 for(const pair of chamferPairs){const original=connector(row.base.selection.plan,pair),current=connector(row.fillet.selection.plan,pair);assert.equal(current.length,1);assert.equal(current[0].id,original[0].id);}
 for(const [stage,selections,kind,f]of [[row.fillet,row.fillet.selected,'fillet',40],[row.chamfer,row.chamfer.selected,'chamfer-equal',41]]){
  for(const id of selections){assert(!stage.selection.plan.edges.some(e=>e.id===id));const u=stage.selection.plan.unresolved.filter(x=>x.kind==='edge'&&x.id===id);assert.equal(u.length,1);assert.equal(u[0].featureId,f);assert.equal(u[0].originFeatureId,10);const blend=stage.selection.plan.faces.filter(x=>x.role==='blend'&&x.sourceEdgeId===id&&x.kind===kind);assert.equal(blend.length,1);assert.equal(blend[0].originFeatureId,10);}
 }
 assert.equal(row.fillet.selection.plan.faces.filter(x=>x.role==='blend').length,2);assert.equal(row.chamfer.selection.plan.faces.filter(x=>x.role==='blend').length,4);
 for(const firstFailure of row.fillet.selection.plan.unresolved.filter(x=>Object.hasOwn(x,'id'))){const retained=row.chamfer.selection.plan.unresolved.find(x=>x.id===firstFailure.id);same(retained,firstFailure);}
 same(row.cutBefore,row.cutAfter);same({catalog:row.fillet.catalog,selection:row.fillet.selection,mesh:row.fillet.mesh},row.filletAfter);
 for(const a of row.ancestors)same(a.before,a.after);
 const expected={'selection-producer':'INVALID_SELECTION_BINDING','boolean-producer-a':'INVALID_SELECTION_BINDING','boolean-producer-b':'INVALID_SELECTION_BINDING','unknown-edge':'UNRESOLVED_SELECTION'};
 for(const r of row.refusals){assert.equal(r.outcome?.code,expected[r.id],JSON.stringify(r));same(r.before,r.after);}
 assert.equal(row.staleSelection.outcome?.code,'UNRESOLVED_SELECTION');same({catalog:row.staleSelection.before.catalog,selection:row.staleSelection.before.selection,mesh:row.staleSelection.before.mesh},row.staleSelection.after);
 for(const r of row.disposed)assert.equal(r.outcome?.code,'INVALID_HANDLE');
 return{id:fixture.id,cuts:5,nativeVolume:row.chamfer.result.evidence.nativeVolume,nativePointChecks:row.cuts.reduce((n,c)=>n+c.points.length,0)+row.chamfer.points.length,contexts:contexts.length,preservedAncestors:row.ancestors.length};
}
function checkNaming(state,featureId,contexts){
 assert(['available','unavailable'].includes(state.selection.status));
 if(state.selection.status==='available')checkPlan(state.selection.plan,featureId,contexts);
 else{assert.equal(typeof state.selection.reason,'string');assert(state.selection.reason.length>0);}
}
export function checkControls(c){
 assert(!c.emptyMultiError,JSON.stringify(c.emptyMultiError));assert(!c.identicalError,JSON.stringify(c.identicalError));
 checkShape(c.multi,2000,2,{min:[0,0,0],max:[30,10,10]},0);
 checkNaming(c.multi,102,[context(100,'control-a'),context(101,'control-b')]);
 checkShape(c.multiContinuation,1500,2,{min:[5,0,0],max:[30,10,10]},0);
 checkNaming(c.multiContinuation,104,[context(100,'control-a'),context(101,'control-b'),context(103,'control-cut')]);
 checkShape(c.empty,0,0,null,0);checkNaming(c.empty,105,[context(100,'control-a'),context(101,'control-b')]);
 checkShape(c.emptyContinuation,125,1,{min:[40,0,0],max:[45,5,5]},0);
 checkNaming(c.emptyContinuation,107,[context(100,'control-a'),context(101,'control-b'),context(106,'control-c')]);
 if(c.empty.selection.status==='available'&&c.emptyContinuation.selection.status==='available')for(const u of c.empty.selection.plan.unresolved.filter(x=>Object.hasOwn(x,'id')))same(c.emptyContinuation.selection.plan.unresolved.find(x=>x.id===u.id),u);
 same(c.controlOperands.beforeA,c.controlOperands.afterA);same(c.controlOperands.beforeB,c.controlOperands.afterB);
 assert.equal(c.missingProducers.outcome?.code,'INVALID_REQUEST');assert.equal(c.missingProducers.posts,0);same(c.missingProducers.beforeA,c.missingProducers.afterA);same(c.missingProducers.beforeB,c.missingProducers.afterB);
 checkShape(c.identical,1000,1,{min:[0,0,0],max:[10,10,10]},0);
 checkNaming(c.identical,202,[context(200,'control-a'),context(201,'control-identical')]);
 same(c.identical.beforeA,c.identical.afterA);same(c.identical.beforeB,c.identical.afterB);
 return{multiSolids:2,emptyTriangles:c.empty.mesh.triangleCount,emptyContinuationVolume:125,identicalVolume:1000};
}
