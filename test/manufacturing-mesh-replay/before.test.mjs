// Source absence/real pool only; no Native or app geometry execution.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {createEvaluationResourcePool} from '../../web/app/cad/craft/evaluationResources.mjs';
import {readCandidateWorkerManufacturingMesh} from '../../modules/engine/solid/solidLedger.mjs';
test('actual observation prerequisite permanently forbids publication',()=>{assert.equal(typeof readCandidateWorkerManufacturingMesh,'function');const pool=createEvaluationResourcePool(),c=new AbortController(),o=pool.begin({signal:c.signal,valid:()=>true,purpose:'observation'});try{o.requireObservationOnly();o.seal();assert.throws(()=>o.accept(),{code:'OBSERVATION_PUBLICATION_FORBIDDEN'});}finally{o.close();}assert.equal(pool.usage.candidates,0);});
test('required protected orchestration module must exist',()=>assert.ok(fs.existsSync(new URL('../../web/app/cad/craft/workerManufacturingMeshReplay.ts',import.meta.url))));
test('Craft exposes preparation through shared read dispatcher',()=>{const s=fs.readFileSync(new URL('../../web/app/cad/craft/craftBundle.ts',import.meta.url),'utf8');assert.match(s,/prepareWorkerManufacturingMeshes/);assert.match(s,/'manufacturing-meshes'/);});
