import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const r=JSON.parse(readFileSync(new URL('./browser-r4-receipt.json',import.meta.url),'utf8'));assert.equal(r.status,'PASS');
const a=r.observed.rows.find(x=>x.id==='triangle'),b=r.observed.rows.find(x=>x.id==='same-authored-IDs-reversed');
const targets=x=>{const p=x.result.constructionProvenance;return Object.fromEntries(p.sourceBinding.nativeSlotBindings[0].edges.map((c,i)=>{const e=p.data.sourceLoops[0].edges[i];return[c.curveId,[e.firstEdge,e.lastEdge,e.sweptFace]];}).sort(([a],[b])=>a.localeCompare(b)));};
const keys=x=>[...x.selection.selection.plan.edges,...x.selection.selection.plan.faces].map(x=>x.id).sort();
assert.notDeepEqual(targets(a),targets(b),'The observed native mapping must really have changed');assert.deepEqual(keys(a),keys(b));
assert.equal(r.observed.rows.length,9);assert.equal(r.observed.rows.reduce((s,x)=>s+x.classification.length,0),32);assert.equal(r.observed.workers.length,14);assert(r.observed.workers.every(w=>w.terminated));assert.equal(r.liveOwnedWorkerTargets,0);assert(r.ownedBrowserClosed&&r.ownedProfileRemoved);
console.log(JSON.stringify({status:'PASS',scope:'Actual frozenR4 component observations; not public ledger/authoring qualification',ordinaryCases:8,windingCompanion:1,nativeTargetsActuallyReordered:true,authoredKeysUnchanged:true,beforeTargets:targets(a),reversedTargets:targets(b),classifications:32,workersTerminated:14,ownedBrowserAndProfileClosed:true},null,2));
