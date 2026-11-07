// Pure authored history/journal composition, not an activated app or geometry.
import test from 'node:test';import assert from 'node:assert/strict';
import {captureAuthoredHistory} from '../../web/app/cad/craft/captureAuthoredHistory.mjs';
import {emptyAuthoredEditJournal,captureThroughHoleParameters,recordThroughHoleEdit,planThroughHoleTravel} from '../../web/app/cad/craft/authoredEditJournal.mjs';
import {hasOnlyUnconsumedSketchHistory} from '../../web/app/cad/craft/unconsumedSketchSave.mjs';
import {OCC_BOOLEAN_HISTORY_BUILD as build} from '../../modules/engine/mount/engineCatalog.mjs';
import {solidBodyId} from '../../modules/engine/solid/solidIntent.mjs';
const common={version:1,unit:'millimeter',engine:'occ',engineRevision:build.revision};
const source={type:'WORKER_SELECTED_PROFILE_EXTRUDE_V2',params:{...common,featureId:10,faceId:'plane',regionId:'sketch-region:rectangle',depth:20,bodyPolicy:'separate'}};
const center={type:'WORKER_THROUGH_HOLES_V1',params:{...common,featureId:20,target:solidBodyId(10),producerFeatureId:10,sourceFeatureId:10,sourceFaceId:'plane',sourceRegionId:source.params.regionId,kind:'centered-through',diameter:10}};
const corners={type:'WORKER_THROUGH_HOLES_V1',params:{...center.params,featureId:21,target:solidBodyId(20),producerFeatureId:20,kind:'four-corner-through',diameter:4,offsetX:8,offsetY:8}};
const history=()=>structuredClone([source,center,corners]);
test('detached source-bound candidate edits only dimensions, travels exactly and retains dependent intent',async()=>{
 const accepted=history(),before=JSON.stringify(accepted),captured=await captureAuthoredHistory(accepted),parameters=captureThroughHoleParameters(captured.history[1].params),journal=recordThroughHoleEdit(emptyAuthoredEditJournal(1,0),{document:1,revision:0,index:1,featureId:20,parameters,after:{diameter:12}});
 captured.history[1].params.diameter=12;const candidate=await captureAuthoredHistory(captured.history);assert.equal(JSON.stringify(accepted),before);assert.notEqual(candidate.signature,captured.signature);assert.deepEqual(candidate.history[2],accepted[2]);
 const undo=planThroughHoleTravel(journal,{document:1,revision:1,direction:'undo',index:1,featureId:20,parameters:candidate.history[1].params});Object.assign(candidate.history[1].params,undo.dimensions);assert.equal((await captureAuthoredHistory(candidate.history)).signature,captured.signature);
 const redo=planThroughHoleTravel(undo.next,{document:1,revision:2,direction:'redo',index:1,featureId:20,parameters:candidate.history[1].params});assert.deepEqual(redo.dimensions,{diameter:12});
});
test('consumed source plane cannot take unrelated-sketch save shortcut',()=>{assert.equal(hasOnlyUnconsumedSketchHistory(history(),'plane'),false);assert.equal(hasOnlyUnconsumedSketchHistory(history(),'unrelated-plane'),true);});
for(const [name,mutate] of [
 ['unknown source',h=>h[2].params.sourceFeatureId=99],['wrong face',h=>h[2].params.sourceFaceId='elsewhere'],['wrong region',h=>h[2].params.sourceRegionId='sketch-region:other'],['consumed target',h=>{h[2].params.producerFeatureId=10;h[2].params.target=solidBodyId(10);}],['missing offsets',h=>delete h[2].params.offsetX],['duplicate feature',h=>h[2].params.featureId=20],['mixed backend',h=>h[2].params.engineRevision='sha256:'+'a'.repeat(64)+':'+'b'.repeat(64)]])test(`unrelated-save proof refuses ${name}`,()=>{const h=history();mutate(h);assert.equal(hasOnlyUnconsumedSketchHistory(h,'unrelated-plane'),false);});
