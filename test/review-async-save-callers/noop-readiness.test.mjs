// Actual async Save/action/receipt methods with synthetic Viewer/store controls.
// No browser, solver, Worker execution or signed host acceptance is claimed.
import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {unchangedSketchSave} from '../../web/app/cad/sketch/unchangedSketchSave.mjs';
import {isStableSketchForSave,sameSketchSaveFrame,makeSketchSaveReceipt,saveAndExitEditor} from '../../web/app/cad/craft/unconsumedSketchSave.mjs';
const fixture=JSON.parse(readFileSync(new URL('../mechanical/noop-sketch-save-first.fixture.json',import.meta.url),'utf8'));
const body=readFileSync(process.env.CODI_NOOP_SAVE_SOURCE||new URL('../../web/app/cad/sketch/inPlaceSketcher.js',import.meta.url),'utf8').match(/\n  async save\(\) \{([\s\S]*?)\n  \}/)?.[1];assert.ok(body);
function setup(onSerialize=()=>{}){
 const stored=fixture.storedSource,sketch=JSON.parse(stored),frame=sketch.metadata.boundaryFrame,boundary=sketch.boundary,face={id:fixture.faceId},draft=structuredClone(sketch);delete draft.metadata;delete draft.boundary;
 let writes=0,workers=0,exits=0,serializations=0,epoch=0;const reports=[],tool={},system={inTransaction:false,transactionBefore:null,conflicting:new Set(),redundant:new Set()};
 const viewer={parametricManager:{inTransaction:false,stages:[{algNumSystem:system}]},historyManager:{recoverySnapshot:null},toolManager:{tool,defaultTool:tool},io:{serializeSketch(metadata){onSerialize(++serializations,viewer);return JSON.stringify({...draft,metadata});}}};
 const storage={get:()=>stored,versionOf:()=>1,namespaceRevision:()=>1,set(){writes++;}},project={documentGeneration:1,isDocumentCurrent:()=>true,sketchStorageNamespace:'fixture'},expressions={signature:fixture.currentExpressionSignature,script$:{revision:1},list$:{revision:1},errors$:{revision:1},table$:{revision:1}};
 const ctx={projectService:project,storageService:storage,services:{storage},cadRegistry:{findFace:()=>face},expressionService:expressions};
 const editor={ctx,face,viewer,boundaryAtOpen:boundary,boundaryFrameAtOpen:frame,sketchStorageKey:'sketch',exit(){exits++;this.face=null;this.viewer=null;}};
 editor.save=new Function('getSketchBoundaries','sketchBoundaryFrame','boundaryGeometryClose','sameSketchSaveFrame','unchangedSketchSave','sketchMutationEpoch','makeSketchSaveReceipt','isStableSketchForSave','captureActiveSketchForDiagnostics','runSketchSolve','sketchWorkerUrl',`return async function(){${body}}`)(()=>boundary,()=>frame,(a,b)=>JSON.stringify(a)===JSON.stringify(b),sameSketchSaveFrame,unchangedSketchSave,()=>epoch,makeSketchSaveReceipt,isStableSketchForSave,()=>{throw Error('No-op must not capture for Worker');},()=>{workers++;throw Error('No-op must not start Worker');},'fixture-worker');
 return {editor,viewer,system,reports,run:()=>saveAndExitEditor(editor,message=>reports.push(message)),get writes(){return writes;},get workers(){return workers;},get exits(){return exits;},get stored(){return storage.get();},assertUnwritten(){assert.equal(writes,0);assert.equal(workers,0);assert.equal(storage.get(),fixture.storedSource);assert.equal(editor.savePending,false);}};
}
const refusal=error=>error.name==='AbortError'&&!('committed' in error);
test('stable byte no-op retains stored text and starts no Worker before successful exit',async()=>{const f=setup();await f.run();assert.equal(f.exits,1);assert.deepEqual(f.reports,[]);f.assertUnwritten();});
test('initial active tool/transactions/rejected relation refuse unchanged saves without exit',async()=>{
 for(const mutate of [f=>{f.viewer.toolManager.tool={};},f=>{f.viewer.parametricManager.inTransaction=true;},f=>{f.system.inTransaction=true;},f=>{f.system.transactionBefore={};},f=>{f.system.conflicting.add({});}]){const f=setup();mutate(f);await assert.rejects(f.run(),/Finish the current sketch operation/);assert.equal(f.exits,0);assert.equal(f.reports.length,1);f.assertUnwritten();}
});
test('tool and transaction changes before either async receipt check preserve the open editor',async()=>{
 for(const late of [false,true])for(const mode of ['tool','transaction']){const mutate=viewer=>{if(mode==='tool')viewer.toolManager.tool={};else viewer.parametricManager.inTransaction=true;};const f=setup((count,viewer)=>{if(!late&&count===1)queueMicrotask(()=>mutate(viewer));});const pending=f.run();if(late)queueMicrotask(()=>mutate(f.viewer));await assert.rejects(pending,refusal);assert.equal(f.exits,0);assert.equal(f.reports.length,1);f.assertUnwritten();}
});
test('receipt rechecks readiness after its own serialization callbacks',async()=>{const f=setup((count,viewer)=>{if(count===2)viewer.toolManager.tool={};});await assert.rejects(f.run(),refusal);assert.equal(f.exits,0);f.assertUnwritten();});
test('duplicate Save rejects while the first no-op is pending, without canceling its receipt',async()=>{const f=setup(),first=f.editor.save();await assert.rejects(f.editor.save(),/already in progress/);const receipt=await first;assert.equal(receipt.verifyBeforeExit(),true);assert.equal(f.exits,0);f.assertUnwritten();});
test('a replacement editor or a post-return active tool cannot consume the no-op exit receipt',async()=>{
 const replaced=setup(),pending=replaced.run();queueMicrotask(()=>{replaced.editor.face={};});await assert.rejects(pending,refusal);assert.equal(replaced.exits,0);replaced.assertUnwritten();
 const f=setup(),receipt=await f.editor.save();f.viewer.toolManager.tool={};assert.throws(()=>receipt.verifyBeforeExit(),refusal);assert.equal(f.exits,0);f.assertUnwritten();
});
