// Pure identity tests: genuine R2 topology, explicit synthetic label/renumbering.
// Not a native/public geometry run or a filesystem/security test.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const file=resolve(process.env.CODI_SELECTION_INDEX_MODULE||'modules/engine/mount/prismSelectionIndex.mjs'),hash=()=>createHash('sha256').update(readFileSync(file)).digest('hex'),sourceSHA256=hash();
const {createPrismSelectionIndex:create}=await import(pathToFileURL(file));assert.equal(hash(),sourceSHA256);
const row=JSON.parse(readFileSync(new URL('../polygon-profile-v3-browser/browser-r2-receipt.json',import.meta.url),'utf8')).observed.rows.find(r=>r.id==='annulus'),p=row.result.constructionProvenance,t=row.topology.catalog,rows=[];
const ordinary=create(1,p,t);assert.equal(ordinary.plan.edges.length,4);assert.equal(ordinary.plan.faces.length,4);
for(const [list,resolve]of[[ordinary.plan.edges,ordinary.resolveEdge],[ordinary.plan.faces,ordinary.resolveFace]])for(const item of list)assert(Number.isInteger(resolve(item.id)));
rows.push({name:'ordinary-genuine-R2-label',status:'PASS',advertisedResolved:8});
const long=structuredClone(p);long.sourceBinding.regionId='\\'.repeat(8190);let policy;
try{const index=create(1,long,t);for(const [list,resolve]of[[index.plan.edges,index.resolveEdge],[index.plan.faces,index.resolveFace]])for(const item of list)assert(Number.isInteger(resolve(item.id)));policy='all-advertised-keys-resolve';}catch(e){assert.equal(e.code,'SELECTION_RESOURCE_LIMIT');policy='explicit-bounded-refusal';}
rows.push({name:'allowed8190-backslash-region-label',status:'PASS',policy});
const q=structuredClone(p),u=structuredClone(t),map=(kind,n)=>n?u[kind].length+1-n:0;
u.vertices=t.vertices.slice().reverse().map(v=>({...v,index:map('vertices',v.index)}));
u.edges=t.edges.slice().reverse().map(e=>({...e,index:map('edges',e.index),vertices:e.vertices.map(v=>map('vertices',v))}));
u.faces=t.faces.slice().reverse().map(f=>({...f,index:map('faces',f.index),wires:f.wires.map(w=>w.map(use=>({...use,edge:map('edges',use.edge)})))}));
q.data.caps={firstFace:map('faces',p.data.caps.firstFace),lastFace:map('faces',p.data.caps.lastFace)};
for(const loop of q.data.sourceLoops){for(const e of loop.edges){e.firstEdge=map('edges',e.firstEdge);e.lastEdge=map('edges',e.lastEdge);e.sweptFace=map('faces',e.sweptFace);}for(const v of loop.vertices){v.firstVertex=map('vertices',v.firstVertex);v.lastVertex=map('vertices',v.lastVertex);v.sweptEdge=map('edges',v.sweptEdge);}}
const renumbered=create(1,q,u);assert.deepEqual(renumbered.plan,ordinary.plan);
for(const item of ordinary.plan.edges)assert.equal(renumbered.resolveEdge(item.id),map('edges',ordinary.resolveEdge(item.id)));
for(const item of ordinary.plan.faces)assert.equal(renumbered.resolveFace(item.id),map('faces',ordinary.resolveFace(item.id)));
rows.push({name:'synthetic-bijective-native-renumbering',status:'PASS',sameAuthoredPlan:true,privateTargetsRemapped:true});
const different=create(2,p,t),old=new Set([...ordinary.plan.edges,...ordinary.plan.faces].map(x=>x.id));assert([...different.plan.edges,...different.plan.faces].every(x=>!old.has(x.id)));
rows.push({name:'producer-identity-changes-namespace',status:'PASS'});
assert.equal(hash(),sourceSHA256);const out={status:'PASS',scope:'Pure selection identity and bounds only; explicit synthetic labels/renumbering on genuine R2 observations',sourceSHA256,rows};
if(process.argv[2])writeFileSync(process.argv[2],JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out,null,2));
