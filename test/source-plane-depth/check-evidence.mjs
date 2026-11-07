import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'../..'),dir=path.join(here,'evidence'),sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'))),pins=JSON.parse(fs.readFileSync(path.join(dir,'build-pins.json'))),browser=JSON.parse(fs.readFileSync(path.join(dir,'browser-receipt.json')));
for(const [name,hash] of Object.entries(manifest.files))assert.equal(sha(fs.readFileSync(path.join(root,name))),hash,name);
for(const [name,hash] of Object.entries(pins.sourceHashesBeforeAfter))assert.equal(sha(fs.readFileSync(path.join(root,name))),hash,name);
assert.equal(browser.status,'PASS');assert.equal(browser.buildPins.sketch,pins.sketch);assert.equal(browser.buildPins.service,pins.service);assert.equal(browser.buildPins.browser,pins.browser);assert.deepEqual(browser.buildPins.sourceHashesBeforeAfter,pins.sourceHashesBeforeAfter);
assert.equal(browser.servedHashes['/static/sketch.js'],pins.sketch);assert.equal(browser.servedHashes['/browser.js'],pins.browser);assert.equal(browser.servedHashes['/lib/verb.js'],pins.verb);assert.equal(browser.workers.created,57);assert.equal(browser.workers.destroyed,57);assert.equal(browser.workers.active,0);assert.equal(browser.pageErrors.length,0);assert(Object.values(browser.cleanup).every(value=>value===true));assert.equal(browser.observations.length,24);
const counts={},local=text=>{const value=JSON.parse(text);delete value.metadata.boundaryFrame;return value;};
for(const row of browser.observations){counts[row.kind]=(counts[row.kind]||0)+1;if(row.kind==='candidate-local-intent-refusal'){assert.equal(row.code,'INTENT_CHANGED');continue}if(row.kind==='exact-historical-travel'){assert.equal(row.after,row.before);continue}assert.deepEqual(local(row.after),local(row.before));const before=JSON.parse(row.before).metadata.boundaryFrame,after=JSON.parse(row.after).metadata.boundaryFrame,axis=row.orientation==='XY'?[0,0,1]:row.orientation==='XZ'?[0,1,0]:[1,0,0];assert.deepEqual(row.frame,after);for(let i=0;i<3;i++)assert.equal(after.origin[i],axis[i]===0?0:row.depth);for(const basis of ['x','y','z'])assert.deepEqual(before[basis],after[basis]);}
assert.deepEqual(counts,{empty:9,circle:9,'exact-historical-travel':3,'candidate-local-intent-refusal':3});
function result(name,expected){const log=fs.readFileSync(path.join(dir,name),'utf8');assert(log.includes('ℹ tests '+expected));assert(log.includes('ℹ pass '+expected));assert(log.includes('ℹ fail 0'));}
result('real-worker-service-coordinator.log',21);result('journal-retained.log',76);assert.equal(fs.readFileSync(path.join(dir,'tsc.log'),'utf8'),'');
console.log(JSON.stringify({status:'PASS',productCommit:manifest.productCommit,sourceFiles:Object.keys(pins.sourceHashesBeforeAfter).length,actualWorkerServiceCoordinatorGroups:21,journalGroups:76,chromiumObservations:24,workersReleased:57,scope:'component/source intent and protocol only; native dependent replay, publication and Save/Open remain unqualified'},null,2));
