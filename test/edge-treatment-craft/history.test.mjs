// Real pure capture+journal composition. This does not activate Craft or evaluate geometry.
import test from 'node:test';import assert from 'node:assert/strict';
import {captureAuthoredHistory} from '../../web/app/cad/craft/captureAuthoredHistory.mjs';
import {emptyAuthoredEditJournal,captureSolidEdgeTreatmentParameters,recordSolidEdgeTreatmentEdit,planSolidEdgeTreatmentTravel} from '../../web/app/cad/craft/authoredEditJournal.mjs';
import {solidBodyId} from '../../modules/engine/solid/solidIntent.mjs';
const revision='sha256:'+ 'a'.repeat(64)+':'+ 'b'.repeat(64);
const params={version:1,unit:'millimeter',engine:'occ',engineRevision:revision,featureId:3,target:solidBodyId(2),producerFeatureId:2,kind:'fillet',edgeIds:['opaque-edge-B','opaque-edge-A'],size:3};
const history=()=>[{type:'WORKER_SELECTED_PROFILE_EXTRUDE_V2',params:{featureId:2,faceId:'plane',regionId:'source-region',engineRevision:revision,depth:20}},{type:'WORKER_SOLID_EDGE_TREATMENT_V1',params:{...params,edgeIds:[...params.edgeIds]}},{type:'WORKER_SOLID_EDGE_TREATMENT_V1',params:{...params,featureId:4,producerFeatureId:3,target:solidBodyId(3),kind:'chamfer-equal',edgeIds:['other-1','other-2'],size:1}}];
test('real detached history capture permits size-only candidate, exact undo/redo and retained descendants',async()=>{
 const accepted=history(),before=JSON.stringify(accepted),captured=await captureAuthoredHistory(accepted),parameters=captureSolidEdgeTreatmentParameters(captured.history[1].params);
 const journal=recordSolidEdgeTreatmentEdit(emptyAuthoredEditJournal(1,0),{document:1,revision:0,index:1,featureId:3,parameters,after:2});captured.history[1].params.size=2;
 const candidate=await captureAuthoredHistory(captured.history);assert.equal(JSON.stringify(accepted),before);assert.notEqual(candidate.signature,captured.signature);
 const expected=JSON.parse(before);expected[1].params.size=2;assert.deepEqual(candidate.history,expected);assert.equal(journal.entries[0].kind,'solid-edge-treatment');
 const undo=planSolidEdgeTreatmentTravel(journal,{document:1,revision:1,direction:'undo',index:1,featureId:3,parameters:candidate.history[1].params});candidate.history[1].params.size=undo.size;
 assert.equal((await captureAuthoredHistory(candidate.history)).signature,captured.signature);
 const redo=planSolidEdgeTreatmentTravel(undo.next,{document:1,revision:2,direction:'redo',index:1,featureId:3,parameters:candidate.history[1].params});candidate.history[1].params.size=redo.size;assert.deepEqual(candidate.history,expected);
 assert.deepEqual(candidate.history[2],accepted[2]);assert.deepEqual(candidate.history[1].params.edgeIds,params.edgeIds);
});
test('currentness refusal during real yielded capture leaves accepted history/journal exact',async()=>{
 const accepted=history();accepted.push(...Array.from({length:45},(_,i)=>({type:'fixture-metadata',params:{featureId:10+i,a:i,b:i,c:i}})));
 const before=JSON.stringify(accepted),journal=emptyAuthoredEditJournal(1,0);let checks=0;
 await assert.rejects(captureAuthoredHistory(accepted,()=>{if(++checks>1)throw Error('fixture superseded')}),/superseded/);
 assert(checks>1);assert.equal(JSON.stringify(accepted),before);assert.equal(journal.cursor,0);
});
test('invalid scalar and immutable selection/build changes cannot produce a travel proposal',async()=>{
 const accepted=history(),captured=await captureAuthoredHistory(accepted),parameters=captureSolidEdgeTreatmentParameters(captured.history[1].params),base=emptyAuthoredEditJournal(1,0);
 for(const after of [0,-1,'2',Infinity,1e6+1])assert.throws(()=>recordSolidEdgeTreatmentEdit(base,{document:1,revision:0,index:1,featureId:3,parameters,after}));
 const journal=recordSolidEdgeTreatmentEdit(base,{document:1,revision:0,index:1,featureId:3,parameters,after:2});
 for(const mutation of [{engineRevision:'sha256:'+ 'c'.repeat(64)+':'+ 'b'.repeat(64)},{edgeIds:[...params.edgeIds].reverse()},{target:solidBodyId(7),producerFeatureId:7},{kind:'chamfer-equal'}])assert.throws(()=>planSolidEdgeTreatmentTravel(journal,{document:1,revision:1,direction:'undo',index:1,featureId:3,parameters:{...parameters,size:2,...mutation}}));
 assert.equal(journal.cursor,1);assert.equal(accepted[1].params.size,3);
});
