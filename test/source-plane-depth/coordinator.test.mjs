// Execute the exact private coordinator from Craft with genuine prepared source
// observations. The stream sink records proposals; it never evaluates native
// geometry or acknowledges successful publication.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {randomUUID} from 'node:crypto';
import {captureAuthoredHistory} from '../../web/app/cad/craft/captureAuthoredHistory.mjs';
import {sketchRevision} from '../../web/app/cad/craft/sketchRevision.mjs';
import {captureSourcePlaneParameters,sourcePlaneDepth} from '../../web/app/sketcher/headless/sourcePlaneDepthEnvelope.mjs';
import {emptyAuthoredEditJournal,recordSourcePlaneDepthEdit,planSourcePlaneDepthTravel} from '../../web/app/cad/craft/authoredEditJournal.mjs';
import {installWindow,drain,lifecycle} from './platform.mjs';
installWindow();
const require=createRequire(import.meta.url),ts=require('typescript'),api=require('../../.build/source-plane-depth/service.cjs');
const text=fs.readFileSync(new URL('../../web/app/cad/craft/craftBundle.ts',import.meta.url),'utf8'),tree=ts.createSourceFile('craft.ts',text,ts.ScriptTarget.Latest,true),functions=[];
function visit(node){if(ts.isFunctionDeclaration(node)&&node.name?.text==='submitPreparedReplay')functions.push(node.getText(tree));ts.forEachChild(node,visit)}visit(tree);assert.equal(functions.length,1);
const compiled=ts.transpileModule(functions[0]+';globalThis.submit=submitPreparedReplay;',{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText;
async function observed(){const frame=api.sketchBoundaryFrame(api.realPlane('XY',0)),empty=await api.runSketchSolve('/static/sketch.js',{task:'sketch-transition-empty',revision:randomUUID(),unit:'millimeter',frame}),before=JSON.stringify(JSON.parse(empty.serializedSketch),null,2),prepared=await api.runSourcePlaneDepthPreparation('/static/sketch.js',{revision:randomUUID(),unit:'millimeter',sketchJSON:before,frame,orientation:'XY',beforeDepth:0,afterDepth:12,candidateJSON:null});return{before,after:prepared.serializedSketch,frame:prepared.frame};}
async function fixture(observation,{travel=false}={}){
 const faceId='actual-component-plane-face',key='sketch/'+faceId,identity={index:0,featureId:1,faceId,orientation:'XY'},current=travel?observation.after:observation.before,target=travel?observation.before:observation.after,depth=travel?12:0;
 const history=[{type:'PLANE',params:{featureId:'1',orientation:'XY',datum:null,depth}}],previous={history,pointer:0},signature=(await captureAuthoredHistory(history)).signature,empty=emptyAuthoredEditJournal(1,0),journal=travel?recordSourcePlaneDepthEdit(empty,{document:1,revision:0,identity,beforeDepth:0,afterDepth:12,before:observation.before,after:observation.after}):empty;
 let source=current,version=1,calls=0,discarded=0;const writes=[],proposals=[],errors=[],callbacks=new Map(),storage={getAllKeysFromNamespace:()=>[key],get:k=>k===key?source:null,versionOf:k=>k===key?version:null},service={documentGeneration:1,sketchStorageNamespace:'sketch/',sketchStorageKey:id=>'sketch/'+id,isDocumentCurrent:doc=>doc===1};
 const preparation={sketchOverrides:[{id:faceId,data:target}],sketchSourceFrames:[{id:faceId,frame:observation.frame}],requireCurrent(){calls++},requireCommittedCurrent(){},async prepare(){return{discard(){discarded++}}}};
 const intent={kind:'source-plane-depth',...identity,beforeDepth:depth,afterDepth:travel?0:12,before:current,after:target,...(travel?{direction:'undo'}:{})};
 const env={captureAuthoredHistory,sketchRevision,captureSourcePlaneParameters,sourcePlaneDepth,recordSourcePlaneDepthEdit,planSourcePlaneDepthTravel,requireEngineCleanup(){},pendingPipelines:0,pendingModifications:0,modifications$:{value:previous,next:value=>proposals.push(value)},evaluationEpoch:1,fullTipSignature:signature,fullTipSketchRevision:sketchRevision(storage,'sketch/'),fullTipMaterialSurfaceRevision:'material:1',authoredJournal$:{value:journal},modificationCallbacks:callbacks,ctx:{projectService:service,storageService:storage,projectManager:{inspectMaterialSurfaceRevision:()=>'material:1'}},superseded:()=>new DOMException('Superseded','AbortError'),Promise,Number,Error};
 vm.createContext(env);vm.runInContext(compiled,env);
 return{env,preparation,intent,previous,journal,proposals,callbacks,errors,storage,writes,run:()=>env.submit(()=>{throw Error('This fixture cannot accept a native result')},error=>errors.push(error),preparation,intent),changeSource:()=>{source+=' ';version++},discarded:()=>discarded,calls:()=>calls};
}
test('exact Craft coordinator proposes detached plane history and one source-byte journal without publishing',async()=>{
 const observation=await observed(),f=await fixture(observation),before=JSON.stringify(f.previous);await f.run();assert.equal(f.errors.length,0);assert.equal(f.proposals.length,1);assert.equal(JSON.stringify(f.previous),before);const next=f.proposals[0],callback=f.callbacks.get(next);assert.equal(next.history[0].params.depth,12);assert.equal(f.previous.history[0].params.depth,0);assert.notEqual(next.history,f.previous.history);assert.equal(callback.journalProposal.cursor,1);assert.equal(callback.journalProposal.entries[0].before,observation.before);assert.equal(callback.journalProposal.entries[0].after,observation.after);assert.equal(callback.journalSignature,(await captureAuthoredHistory(next.history)).signature);assert.equal(f.storage.get('sketch/actual-component-plane-face'),observation.before);assert.equal(f.writes.length,0);
 const workspace=await callback.preparation.prepare([],next);assert.equal(f.discarded(),0);workspace.discard();assert.equal(f.discarded(),1);
});
test('exact Craft coordinator privately travels the original byte journal and rejects mismatched candidate history',async()=>{
 const observation=await observed(),f=await fixture(observation,{travel:true});await f.run();assert.equal(f.errors.length,0);const next=f.proposals[0],callback=f.callbacks.get(next);assert.equal(next.history[0].params.depth,0);assert.equal(callback.journalProposal.cursor,0);assert.equal(callback.journalProposal.entries,f.journal.entries);assert.equal(callback.journalProposal.entries[0].before,observation.before);const changed=structuredClone(next);changed.history[0].params.depth=5;await assert.rejects(callback.preparation.prepare([],changed),e=>e.name==='AbortError');assert.equal(f.discarded(),1);assert.equal(f.previous.history[0].params.depth,12);
});
test('stale source/tip and changed journal proposals refuse before dispatch; post-prepare stale state discards workspace',async()=>{
 const observation=await observed();for(const mutation of [f=>f.changeSource(),f=>f.env.fullTipSignature+='changed',f=>f.env.authoredJournal$.value=emptyAuthoredEditJournal(2,0),f=>f.intent.afterDepth=0,f=>f.preparation.sketchOverrides[0].id='wrong']){const f=await fixture(observation);mutation(f);await f.run();assert.equal(f.errors.length,1);assert.equal(f.proposals.length,0);assert.equal(f.previous.history[0].params.depth,0);}
 const f=await fixture(observation);await f.run();const next=f.proposals[0],callback=f.callbacks.get(next);f.changeSource();await assert.rejects(callback.preparation.prepare([],next),e=>e.name==='AbortError');assert.equal(f.discarded(),1);
});
test('all genuine source-producing Workers terminate',async()=>{await drain();assert.equal(lifecycle.started,lifecycle.terminated)});
