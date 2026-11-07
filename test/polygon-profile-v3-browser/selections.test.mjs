import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createPrismSelectionIndex} from '../../modules/engine/mount/prismSelectionIndex.mjs';
const receipt=JSON.parse(fs.readFileSync(new URL('./browser-r2-receipt.json',import.meta.url)));
const rows=receipt.observed.rows,clone=value=>structuredClone(value);
const make=(row,featureId=17)=>createPrismSelectionIndex(featureId,row.result.constructionProvenance,row.topology.catalog);
test('actual R2 ancestry yields authored selections without exposing native indices',()=>{
 for(const row of rows){const selection=make(row),plan=selection.plan,catalog=row.topology.catalog;
  assert.equal(plan.faces.length,catalog.faces.length);assert.equal(new Set(plan.edges.map(e=>selection.resolveEdge(e.id))).size,plan.edges.length);
  for(const edge of plan.edges){assert.equal(edge.geometry,catalog.edges[selection.resolveEdge(edge.id)-1].type);assert.equal(Object.hasOwn(edge,'index'),false);assert.equal(Object.hasOwn(edge,'source'),false);}
  for(const face of plan.faces)assert.equal(face.geometry,catalog.faces[selection.resolveFace(face.id)-1].type);
  assert.equal(plan.unresolved.reduce((n,r)=>n+r.count,0)+plan.edges.length,catalog.edges.length);
  assert.ok(Object.isFrozen(plan));assert.ok(Object.isFrozen(plan.edges));
 }
});
test('renumbered native topology resolves the same authored identities to current indices',()=>{
 const row=clone(rows.find(r=>r.result.constructionProvenance.data.sourceLoops[0].edges.length===6));
 const before=make(row),n=row.topology.catalog.edges.length,rename=i=>n+1-i;
 row.topology.catalog.edges.reverse();row.topology.catalog.edges.forEach((e,i)=>e.index=i+1);
 for(const face of row.topology.catalog.faces)for(const wire of face.wires)for(const use of wire)use.edge=rename(use.edge);
 for(const loop of row.result.constructionProvenance.data.sourceLoops){for(const e of loop.edges){e.firstEdge=rename(e.firstEdge);e.lastEdge=rename(e.lastEdge);}for(const v of loop.vertices)v.sweptEdge=rename(v.sweptEdge);}
 const after=make(row);assert.deepEqual(after.plan,before.plan);for(const edge of before.plan.edges)assert.equal(after.resolveEdge(edge.id),rename(before.resolveEdge(edge.id)));
});
test('escaped authored identities cannot produce published keys that the resolver refuses',()=>{
 const row=clone(rows.find(r=>r.id==='annulus'));row.result.constructionProvenance.sourceBinding.regionId='\\'.repeat(8190);
 assert.throws(()=>make(row),{code:'SELECTION_RESOURCE_LIMIT'});
 row.result.constructionProvenance.sourceBinding.regionId='\\'.repeat(1000);
 const index=make(row);for(const edge of index.plan.edges)assert.ok(index.resolveEdge(edge.id));for(const face of index.plan.faces)assert.ok(index.resolveFace(face.id));
});
test('namespace, missing sources and duplicate ancestry do not choose a replacement',()=>{
 const row=rows[0],a=make(row),b=make(row,18);assert.throws(()=>b.resolveEdge(a.plan.edges[0].id),{code:'UNRESOLVED_SELECTION'});
 assert.throws(()=>createPrismSelectionIndex(17,{status:'unavailable'},row.topology.catalog),{code:'SELECTION_UNAVAILABLE'});
 const duplicate=clone(row);duplicate.result.constructionProvenance.data.sourceLoops[0].edges[1].firstEdge=duplicate.result.constructionProvenance.data.sourceLoops[0].edges[0].firstEdge;
 assert.throws(()=>make(duplicate),{code:'ENGINE_FAILURE'});
 const changed=clone(row);changed.result.constructionProvenance.sourceBinding.nativeSlotBindings[0].edges[0].curveId='replacement-curve';
 assert.throws(()=>make(changed).resolveEdge(a.plan.edges[0].id),{code:'UNRESOLVED_SELECTION'});
});
