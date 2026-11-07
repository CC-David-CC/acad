import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createBlockLearningService} from '../../web/app/cad/learning/blockService.js';
function fixture(){
 let calls=0;const ctx={projectManager:{unit:'millimeter',snapshotCurrentProject:()=>({unit:'millimeter',project:{sketches:[]}})},projectService:{id:'one',counterGenerator:{generateFeatureId:()=>{calls++;return '1'}}},services:{sketcher:{inPlaceEditor:{inEditMode:false}}},streams:{wizard:{insertOperation:{value:null}}},wizardService:{workingRequest$:{value:null}},craftService:{isProcessing:false,modifications$:{value:{history:[],pointer:-1}},models$:{value:[]},pipelineFailure$:{value:null},modify(){calls++}}};
 return {ctx,calls:()=>calls};
}
test('block commands reject invalid dimensions and unavailable accounts before dispatch',async()=>{
 const {ctx,calls}=fixture(),service=createBlockLearningService(ctx),revision=service.inspect().revision;
 await assert.rejects(service.create(revision,{x:0,y:40,z:10}),/between/);
 await assert.rejects(service.create(revision,{x:60,y:40,z:10},{valid:()=>false}),/no longer available/);
 assert.equal(calls(),0);
});
test('unit and stale document tokens fail closed before dispatch',async()=>{
 const {ctx,calls}=fixture(),service=createBlockLearningService(ctx),revision=service.inspect().revision;
 ctx.craftService.modifications$.value={history:[],pointer:-1};
 await assert.rejects(service.create(revision,{x:60,y:40,z:10}),/changed/);
 ctx.projectManager.unit='inch';assert.throws(()=>service.inspect(),/millimeter/);
 assert.equal(calls(),0);
});
