// Actual PM snapshot methods and source captureModel; accepted geometry is a
// protocol fixture. No Native/signed-save claim.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {fixture} from '../fixture.mjs';
test('repeated native snapshot/dirty reads never write model cache or mutate accepted definitions',async()=>{
 const f=await fixture({drawing:true});try{const before={storage:f.storage.revision,model:JSON.parse(JSON.stringify(f.project.captureModel())),metadata:f.manager.getManufacturingMetadata(),drawing:f.manager.getLinkedPartDrawingDefinition(),counter:{...f.project.counterGenerator.projectCounters}},prepared=await f.manager.prepareHostSave(),save=f.project.save;let writes=0;f.project.save=()=>{writes++;return save.call(f.project);};
 for(let i=0;i<3;i++){const snapshot=f.manager.snapshotCurrentProject();assert.deepEqual(snapshot.project.model,before.model);assert.deepEqual(snapshot.manufacturing,before.metadata);assert.deepEqual(snapshot.drawings[0],before.drawing);}
 const observation={beforeStorage:before.storage,afterStorage:f.storage.revision,explicitSaveCalls:writes,preparedCurrent:prepared.isCurrent(),counters:f.project.counterGenerator.projectCounters};if(process.env.CODI_SNAPSHOT_REVIEW_OUTPUT)fs.writeFileSync(process.env.CODI_SNAPSHOT_REVIEW_OUTPUT,JSON.stringify(observation,null,2)+'\n');
 assert.equal(f.storage.revision,before.storage);assert.equal(writes,0);assert.equal(prepared.isCurrent(),true);assert.deepEqual(f.project.counterGenerator.projectCounters,before.counter);
 }finally{await f.close();}
});
