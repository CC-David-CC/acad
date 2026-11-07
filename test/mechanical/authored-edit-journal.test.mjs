import assert from 'node:assert/strict';
import {test} from 'node:test';
import {emptyAuthoredEditJournal,recordExtrusionEdit,planExtrusionTravel,recordHoleEdit,planHoleTravel,recordSketchEdit,planSketchTravel} from '../../web/app/cad/craft/authoredEditJournal.mjs';

test('inverse and forward plans advance only proposed states',()=>{
  const initial=emptyAuthoredEditJournal(3,10);
  const edited=recordExtrusionEdit(initial,{document:3,revision:10,index:2,featureId:4,before:20,after:35});
  const undo=planExtrusionTravel(edited,{document:3,revision:11,direction:'undo',index:2,featureId:4,currentDepth:35});
  assert.equal(initial.cursor,0);assert.equal(edited.cursor,1);assert.equal(undo.depth,20);assert.equal(undo.next.cursor,0);
  const redo=planExtrusionTravel(undo.next,{document:3,revision:12,direction:'redo',index:2,featureId:4,currentDepth:20});
  assert.equal(redo.depth,35);assert.equal(redo.next.cursor,1);
});
test('stale document, revision, identity and depth refuse without mutation',()=>{
  const state=recordExtrusionEdit(emptyAuthoredEditJournal(1,0),{document:1,revision:0,index:1,featureId:8,before:20,after:35});
  const input={document:1,revision:1,direction:'undo',index:1,featureId:8,currentDepth:35};
  for(const change of [{document:2},{revision:2},{index:2},{featureId:9},{currentDepth:36}]) {
    assert.throws(()=>planExtrusionTravel(state,{...input,...change}));assert.equal(state.cursor,1);
  }
});
test('new edit after undo truncates redo and journal is bounded',()=>{
  let state=emptyAuthoredEditJournal(1,0);
  for(let i=0;i<70;i++)state=recordExtrusionEdit(state,{document:1,revision:i,index:0,featureId:1,before:i+1,after:i+2});
  assert.equal(state.entries.length,64);
  const undo=planExtrusionTravel(state,{document:1,revision:70,direction:'undo',index:0,featureId:1,currentDepth:71});
  const next=recordExtrusionEdit(undo.next,{document:1,revision:71,index:0,featureId:1,before:70,after:75});
  assert.throws(()=>planExtrusionTravel(next,{document:1,revision:72,direction:'redo',index:0,featureId:1,currentDepth:75}),/No authored edit/);
});
test('invalid and no-op depths are refused',()=>{
  const state=emptyAuthoredEditJournal(0,0);
  for(const value of [0,-1,Infinity,NaN,1000001,20])assert.throws(()=>recordExtrusionEdit(state,{document:0,revision:0,index:0,featureId:1,before:20,after:value}));
});
test('hole edits store bounded detached numeric deltas and reject stale undo',()=>{
 const before={diameter:4,offsetX:10,offsetY:10},after={diameter:5,offsetX:12,offsetY:11};
 const state=recordHoleEdit(emptyAuthoredEditJournal(1,0),{document:1,revision:0,index:3,featureId:4,kind:'corners',before,after});
 after.diameter=99;assert.equal(state.entries[0].after.diameter,5);
 const undo=planHoleTravel(state,{document:1,revision:1,direction:'undo',index:3,featureId:4,currentDimensions:{diameter:5,offsetX:12,offsetY:11}});
 assert.deepEqual(undo.dimensions,before);assert.equal(undo.next.cursor,0);
 assert.throws(()=>planHoleTravel(state,{document:1,revision:1,direction:'undo',index:3,featureId:4,currentDimensions:after}),/no longer matches/);
 assert.throws(()=>recordHoleEdit(state,{document:1,revision:1,index:3,featureId:4,kind:'centered',before:{diameter:2},after:{diameter:-1}}));
});
test('sketch deltas retain exact bytes with bounded total and stale refusal',()=>{
 let state=emptyAuthoredEditJournal(1,0);
 state=recordSketchEdit(state,{document:1,revision:0,faceId:'face',before:'old',after:'new'});
 assert.throws(()=>planSketchTravel(state,{document:1,revision:1,direction:'undo',faceId:'other',currentBytes:'new'}));
 assert.throws(()=>planSketchTravel(state,{document:1,revision:1,direction:'undo',faceId:'face',currentBytes:'changed'}));
 const undo=planSketchTravel(state,{document:1,revision:1,direction:'undo',faceId:'face',currentBytes:'new'});
 assert.equal(undo.bytes,'old');assert.equal(undo.next.cursor,0);assert.equal(state.cursor,1);
 assert.throws(()=>recordSketchEdit(state,{document:1,revision:1,faceId:'face',before:'old',after:'x'.repeat(1048577)}),/oversized/);
 for(let i=1;i<66;i++)state=recordSketchEdit(state,{document:1,revision:i,faceId:'face',before:'a'.repeat(65533)+i,after:'b'.repeat(65533)+i});
 assert.ok(state.entries.length<64);
});
test('mixed journals evict old snapshots within the retained-string budget and keep cross-kind order',()=>{
 let state=emptyAuthoredEditJournal(7,0),revision=0;
 const before='a'.repeat(65536),after='b'.repeat(65536);
 for(let i=0;i<40;i++) {
   state=recordSketchEdit(state,{document:7,revision:revision++,faceId:'face',before,after});
   state=recordHoleEdit(state,{document:7,revision:revision++,index:3,featureId:4,kind:'centered',before:{diameter:10},after:{diameter:12}});
 }
 const retained=state.entries.reduce((sum,entry)=>sum+(entry.kind==='sketch-bytes'?entry.byteSize:256),0);
 assert.ok(retained<=8*1024*1024);
 assert.ok(state.entries.length<64,'large strings hit the byte budget before the entry limit');
 assert.equal(state.cursor,state.entries.length);
 assert.equal(state.entries[0].kind,'hole-centered','oldest large snapshot was evicted');
 const hole=planHoleTravel(state,{document:7,revision:revision++,direction:'undo',index:3,featureId:4,currentDimensions:{diameter:12}});
 const sketch=planSketchTravel(hole.next,{document:7,revision:revision++,direction:'undo',faceId:'face',currentBytes:after});
 assert.equal(sketch.bytes,before);
 assert.equal(state.cursor-sketch.next.cursor,2);
 const redo=planSketchTravel(sketch.next,{document:7,revision:revision++,direction:'redo',faceId:'face',currentBytes:before});
 assert.equal(redo.bytes,after);
 assert.equal(redo.next.entries,state.entries,'travel does not copy retained entry storage');
});
test('sketch entry bounds use serialized bytes and retain exact non-ASCII text',()=>{
 const initial=emptyAuthoredEditJournal(7,0),before='é'.repeat(32768),after='界'.repeat(21845);
 const state=recordSketchEdit(initial,{document:7,revision:0,faceId:'face',before,after});
 assert.equal(state.entries[0].byteSize,131079);
 assert.equal(planSketchTravel(state,{document:7,revision:1,direction:'undo',faceId:'face',currentBytes:after}).bytes,before);
 assert.throws(()=>recordSketchEdit(initial,{document:7,revision:0,faceId:'face',before:'old',after:'界'.repeat(349526)}),/oversized/);
 assert.equal(initial.cursor,0);assert.equal(initial.entries.length,0);
});
test('dense sketch history retains exact snapshots and caps total storage',()=>{
 let state=emptyAuthoredEditJournal(8,0),revision=0;
 const before='a'.repeat(1024*1024),after='b'.repeat(1024*1024);
 for(let i=0;i<5;i++)state=recordSketchEdit(state,{document:8,revision:revision++,faceId:'face',before,after});
 assert.equal(state.entries.length,1,'two maximum UTF-16 pairs and their identities exceed the aggregate bound');
 assert.ok(state.entries[0].byteSize<=8*1024*1024);
 const undo=planSketchTravel(state,{document:8,revision:revision++,direction:'undo',faceId:'face',currentBytes:after});
 assert.equal(undo.bytes,before);
 assert.equal(planSketchTravel(undo.next,{document:8,revision:revision++,direction:'redo',faceId:'face',currentBytes:before}).bytes,after);
 assert.equal(undo.next.entries,state.entries);
});
