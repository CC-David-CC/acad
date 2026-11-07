// Regression coverage for the sketch history in https://github.com/xibyte/jsketcher/pull/220.
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {runInThisContext} from 'node:vm';
import {HistoryManager} from '../../web/app/sketcher/history';
runInThisContext(readFileSync('web/lib/diff_match_patch.js', 'utf8'));
globalThis.window = globalThis;
let model = JSON.stringify({objects: []});
const viewer = {io: {serializeSketch: () => model, loadSketch: value => { JSON.parse(value); model = value; }}, fullHeavyUIRefresh() {}};
const history = new HistoryManager(viewer);
history.init(model);
const states = [model];
for (let i = 0; i < 20; i++) {
  model = JSON.stringify({objects: Array.from({length: i + 1}, (_, j) => ({id: j, data: 'x'.repeat((i * 13 + j * 7) % 73)}))});
  states.push(model);
  history.checkpoint();
}
for (let i = states.length - 2; i >= 0; i--) { history.undo(); assert.equal(model, states[i]); }
for (let i = 1; i < states.length; i++) { history.redo(); assert.equal(model, states[i]); }
history.undo();
const newEdit = JSON.stringify({objects: ['new edit']});
model = newEdit;
history.redo();
assert.equal(model, newEdit, 'redo must not overwrite an edit made after undo');
history.checkpoint();
history.redo();
assert.equal(model, newEdit, 'new edits discard the old redo branch');
const pointer = history.historyPointer, saved = history.lastCheckpoint;
const realApply = history.dmp.patch_apply;
history.dmp.patch_apply = () => ['bad patch', [false]];
assert.throws(() => history.undo(), /could not be applied/);
assert.equal(history.historyPointer, pointer);
assert.equal(history.lastCheckpoint, saved);
assert.equal(model, newEdit);
history.dmp.patch_apply = realApply;
history.undo();
assert.equal(model, states[states.length - 2]);
const boundedStates = [model];
for (let i = 0; i < 120; i++) {
  model = JSON.stringify({objects: ['bounded', i]});
  boundedStates.push(model);
  history.checkpoint();
}
assert.equal(history.diffs.length, 100);
for (let i = 0; i < 100; i++) history.undo();
assert.equal(model, boundedStates[20]);
history.undo();
assert.equal(model, boundedStates[20], 'pruned history has a stable boundary');
// Failed or incomplete reconstruction must restore the exact pre-undo sketch.
model = JSON.stringify({objects: ['before restore failure']});
history.checkpoint();
const preUndo = model, prePointer = history.historyPointer;
const actualLoad = viewer.io.loadSketch;
let attempts = 0;
viewer.io.loadSketch = value => { attempts++; if (attempts === 1) { model = JSON.stringify({objects: ['partial']}); return; } actualLoad(value); };
assert.throws(() => history.undo(), /previous sketch was restored/);
assert.equal(model, preUndo);
assert.equal(history.historyPointer, prePointer);
viewer.io.loadSketch = () => { model = JSON.stringify({objects: ['partial']}); throw new Error('injected failure'); };
assert.throws(() => history.undo(), /rollback failed/);
assert.equal(history.recoverySnapshot, preUndo);
assert.throws(() => history.redo(), /recovery is required/);
viewer.io.loadSketch = actualLoad;
assert.equal(history.recover(), true);
assert.equal(model, preUndo);
assert.equal(history.recoverySnapshot, null);
console.log('PASS sketch undo, redo, branching, bounded history, failed reconstruction and recovery');

// Large authored strings use bounded exact snapshots, never quadratic text diff.
let largeModel=JSON.stringify({text:'small'});
const largeViewer={io:{serializeSketch:()=>largeModel,loadSketch:value=>{JSON.parse(value);largeModel=value}},fullHeavyUIRefresh(){}};
const largeHistory=new HistoryManager(largeViewer);largeHistory.init(largeModel);
const firstSmall=JSON.stringify({text:'small edited'});largeModel=firstSmall;largeHistory._checkpoint();assert.notEqual(largeHistory.diffs[0].kind,'snapshot');
const bigA=JSON.stringify({objects:[0],text:'x'.repeat(600000)}),bigB=JSON.stringify({objects:[1],text:'x'.repeat(600000)});
const oldGet=largeHistory.getDiff;largeHistory.getDiff=()=>{throw Error('large text must never reach diff')};largeModel=bigA;largeHistory._checkpoint();largeModel=bigB;largeHistory._checkpoint();assert.equal(largeHistory.diffs.at(-1).kind,'snapshot');largeHistory.undo();assert.equal(largeModel,bigA);largeHistory.undo();assert.equal(largeModel,firstSmall);largeHistory.redo();assert.equal(largeModel,bigA);largeHistory.redo();assert.equal(largeModel,bigB);largeHistory.undo();const branch=JSON.stringify({objects:[2],text:'x'.repeat(600000)});largeModel=branch;largeHistory._checkpoint();largeHistory.redo();assert.equal(largeModel,branch);
for(let i=0;i<12;i++){largeModel=JSON.stringify({objects:[i+10],text:'x'.repeat(600000)});largeHistory._checkpoint()}assert.ok(largeHistory.diffs.reduce((n,x)=>n+x.bytes,0)<=8*1024*1024);assert.ok(largeHistory.diffs.length<12);
// An oversized newest transition stays undoable; it is the one explicit
// exception to the normal aggregate-byte budget, rather than an input cap.
const huge=JSON.stringify({text:'z'.repeat(5*1024*1024)});const priorLarge=largeModel;largeModel=huge;largeHistory._checkpoint();assert.equal(largeHistory.diffs.length,1);assert.ok(largeHistory.diffs[0].bytes>8*1024*1024);largeHistory.undo();assert.equal(largeModel,priorLarge);largeHistory.redo();assert.equal(largeModel,huge);
const snapshotPointer=largeHistory.historyPointer,snapshotLoad=largeViewer.io.loadSketch;let snapshotAttempts=0;largeViewer.io.loadSketch=value=>{if(++snapshotAttempts===1){largeModel=JSON.stringify({partial:true});return}snapshotLoad(value)};assert.throws(()=>largeHistory.undo(),/previous sketch was restored/);assert.equal(largeModel,huge);assert.equal(largeHistory.historyPointer,snapshotPointer);largeViewer.io.loadSketch=snapshotLoad;
// Failure during a compact-diff checkpoint leaves the prior bookkeeping intact.
largeHistory.getDiff=oldGet;let atomicModel=JSON.stringify({a:1});const atomicViewer={io:{serializeSketch:()=>atomicModel},fullHeavyUIRefresh(){}};const atomicHistory=new HistoryManager(atomicViewer);atomicHistory.init(atomicModel);atomicHistory._counter=13;atomicModel=JSON.stringify({a:2});atomicHistory.getDiff=()=>{throw Error('injected diff failure')};assert.throws(()=>atomicHistory._checkpoint(),/injected/);assert.deepEqual(atomicHistory.diffs,[]);assert.equal(atomicHistory.historyPointer,-1);assert.equal(atomicHistory.lastCheckpoint,JSON.stringify({a:1}));assert.equal(atomicHistory._counter,13);
console.log('PASS mixed large history, branching, byte eviction, oversize undo and failed checkpoint atomicity');

assert.equal(new HistoryManager(viewer).dmp.Diff_Timeout,0.025);
const resetHistory=new HistoryManager(largeViewer);resetHistory.init(huge);largeModel=branch;resetHistory._checkpoint();assert.ok(resetHistory.diffs.length);resetHistory.init('');assert.equal(resetHistory.diffs.length,0);assert.equal(resetHistory.lastCheckpoint,'');assert.equal(resetHistory.recoverySnapshot,null);
const repeatedA=JSON.stringify({text:'ab'.repeat(900),v:0}),repeatedB=JSON.stringify({text:'ba'.repeat(900),v:1});let smallModel=repeatedA;const smallHistory=new HistoryManager({io:{serializeSketch:()=>smallModel,loadSketch:value=>{smallModel=value}},fullHeavyUIRefresh(){}});smallHistory.init(smallModel);const smallStart=performance.now();smallModel=repeatedB;smallHistory._checkpoint();const smallElapsed=performance.now()-smallStart;assert.notEqual(smallHistory.diffs[0].kind,'snapshot');smallHistory.undo();assert.equal(smallModel,repeatedA);smallHistory.redo();assert.equal(smallModel,repeatedB);console.log('Small adversarial patch milliseconds:',smallElapsed.toFixed(3));
