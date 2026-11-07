// Replays complete actual observations, with additional cap-ring measurements.
// No fresh native/Worker/browser execution occurs in this checker.
import assert from 'node:assert/strict';import {readFileSync}from'node:fs';import{createHash}from'node:crypto';
import{fixtures as inputs,holeIntent,filletPairs,chamferPairs}from'./cases.mjs';import{checkFixture,checkControls,checkWork,near}from'./oracle.mjs';
import{fixtures as oldFixtures,filletPairs as oldFillet,chamferPairs as oldChamfer}from'../boolean-history-browser/cases.mjs';import{checkPlate,checkControls as oldControls}from'../boolean-history-browser/oracle.mjs';
const read=p=>readFileSync(new URL(p,import.meta.url)),hash=b=>createHash('sha256').update(b).digest('hex'),proof=JSON.parse(read('./evidence-r1/receipt.json'));
function load(name,sourcePrefix){const item=proof.runs[name],raw=read('./evidence-r1/'+item.portableFile);assert.equal(raw.length,item.portableBytes);assert.equal(hash(raw),item.portableSHA256);const r=JSON.parse(raw);assert.equal(r.status,'PASS');assert.equal(r.pins.componentManifestSHA256,proof.componentSHA256);assert.deepEqual(r.sourcePins,r.sourcePinsAfter);for(const [p,sha]of Object.entries(r.sourcePins))assert.equal(hash(read(sourcePrefix+p)),sha,p);assert.deepEqual(r.actual.csp,[]);assert.equal(r.liveOwnedWorkerTargets,0);assert(r.actual.workers.every(w=>w.terminated));return r;}
const r=load('through-hole','./'),fixtures=inputs.map(f=>({...f,centerIntent:holeIntent(f,'centered-through'),cornersIntent:holeIntent(f,'four-corner-through')}));
const rows=r.actual.rows.map(row=>({...checkFixture(row,fixtures.find(f=>f.id===row.id),filletPairs,chamferPairs),status:'PASS'}));assert.deepEqual(rows,r.rows);assert.deepEqual(checkControls(r.actual.controls,fixtures[0]),r.controls);checkWork(r.actual.workers,fixtures);
// Independent native measurements only. These coordinates never assign IDs.
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),local=(f,p)=>{const d=p.map((v,i)=>v-f.origin[i]);return[dot(d,f.x),dot(d,f.y),dot(d,f.z)];};let rings=0;
for(const row of r.actual.rows){const f=fixtures.find(f=>f.id===row.id);for(const state of[row.center,row.corners,row.fillet,row.chamfer])for(const face of state.catalog.faces.filter(x=>x.type==='cylinder'&&[2,5].includes(x.analytic.radius))){
 const candidates=[...new Set(face.wires.flat().map(u=>u.edge))].map(i=>state.catalog.edges[i-1]).filter(e=>e.type==='circle');assert.equal(candidates.length,2);
 const heights=candidates.map(e=>{near(e.analytic.radius,face.analytic.radius);near(e.range[1]-e.range[0],Math.PI*2);return local(f.source.frame,e.analytic.center)[2];}).sort((a,b)=>a-b);near(heights[0],0);near(heights[1],f.depth);rings+=2;
}}
assert.equal(rings,96);
const old=load('retained-boolean','../boolean-history-browser/');const oldRows=old.actual.rows.map(row=>({...checkPlate(row,oldFixtures.find(f=>f.id===row.id),oldFillet,oldChamfer),status:'PASS'}));assert.deepEqual(oldRows,old.rows);assert.deepEqual(oldControls(old.actual.controls),old.controls);
console.log(JSON.stringify({status:'PASS',scope:'Recorded genuine through-hole+retained Boolean replay; additional actual cylinder cap-ring depth measurement',rows,retainedBooleanRows:oldRows,capRingsMeasured:rings}));
