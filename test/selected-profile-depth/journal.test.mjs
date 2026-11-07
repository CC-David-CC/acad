import test from 'node:test';import assert from 'node:assert/strict';
import {emptyAuthoredEditJournal,recordSelectedProfileDepthEdit,planSelectedProfileDepthTravel,captureSelectedProfileDepthParameters,recordExtrusionEdit,recordSolidBoxEdit,planSolidBoxTravel} from '../../web/app/cad/craft/authoredEditJournal.mjs';
const parameters={version:1,unit:'millimeter',engine:'occ',engineRevision:'sha256:'+ 'a'.repeat(64)+':'+ 'b'.repeat(64),featureId:3,faceId:'plane',regionId:'sketch-region:{"outer":["circle"]}',depth:5,bodyPolicy:'separate'};
const args={document:2,revision:0,index:1,featureId:3,parameters,after:7.5};
test('selected depth retains exact selection and runtime, scalar-only undo/redo',()=>{
 const base=emptyAuthoredEditJournal(2,0),journal=recordSelectedProfileDepthEdit(base,args),entry=journal.entries[0];
 assert.equal(entry.kind,'selected-profile-depth');assert.equal(entry.before,5);assert.equal(entry.after,7.5);assert.equal(entry.identity.regionId,parameters.regionId);assert(Object.isFrozen(entry.identity));assert(!('profile' in entry));assert(!('mesh' in entry));
 const undo=planSelectedProfileDepthTravel(journal,{...args,revision:1,direction:'undo',parameters:{...parameters,depth:7.5}});assert.equal(undo.depth,5);assert.equal(undo.next.cursor,0);
 const redo=planSelectedProfileDepthTravel(undo.next,{...args,revision:2,direction:'redo'});assert.equal(redo.depth,7.5);assert.equal(redo.next.cursor,1);assert.equal(base.cursor,0);
});
test('every immutable identity mutation refuses travel without journal writes',()=>{
 const journal=recordSelectedProfileDepthEdit(emptyAuthoredEditJournal(2,0),args),before=JSON.stringify(journal);
 for(const [key,value] of Object.entries({version:2,unit:'inch',engine:'manifold',engineRevision:'sha256:'+ 'c'.repeat(64)+':'+ 'b'.repeat(64),featureId:4,faceId:'other',regionId:'sketch-region:other',bodyPolicy:'join',depth:8}))assert.throws(()=>planSelectedProfileDepthTravel(journal,{...args,revision:1,direction:'undo',parameters:{...parameters,depth:7.5,[key]:value}}),key);
 assert.equal(JSON.stringify(journal),before);
});
test('stale/invalid/no-op edits and data accessors refuse',()=>{
 const journal=emptyAuthoredEditJournal(2,0);for(const after of [0,-1,NaN,Infinity,1e6+1,'7.5',5])assert.throws(()=>recordSelectedProfileDepthEdit(journal,{...args,after}));
 assert.throws(()=>recordSelectedProfileDepthEdit(journal,{...args,revision:1}));assert.throws(()=>captureSelectedProfileDepthParameters({...parameters,profile:{}}));
 let reads=0;const bad={...parameters};Object.defineProperty(bad,'depth',{enumerable:true,get(){reads++;return 5}});assert.throws(()=>captureSelectedProfileDepthParameters(bad));assert.equal(reads,0);assert.equal(journal.cursor,0);
});
test('selected travel never accepts an old rectangle or box journal entry',()=>{
 const base=emptyAuthoredEditJournal(2,0),old=recordExtrusionEdit(base,{...args,before:5,after:7.5});assert.throws(()=>planSelectedProfileDepthTravel(old,{...args,revision:1,direction:'undo',parameters:{...parameters,depth:7.5}}),/No selected-profile/);
 const current={x:0,y:0,z:0,width:1,depth:5,height:2},box=recordSolidBoxEdit(base,{...args,engine:'occ',engineRevision:parameters.engineRevision,before:current,after:{...current,depth:7.5}});assert.throws(()=>planSelectedProfileDepthTravel(box,{...args,revision:1,direction:'undo',parameters:{...parameters,depth:7.5}}),/No selected-profile/);
 const undo=planSolidBoxTravel(box,{...args,revision:1,direction:'undo',engine:'occ',engineRevision:parameters.engineRevision,current:{...current,depth:7.5}});assert.deepEqual(undo.values,current);
});
test('editing after undo clears only redo tail and preserves bounded retention',()=>{
 let journal=emptyAuthoredEditJournal(2,0);for(let i=0;i<70;i++)journal=recordSelectedProfileDepthEdit(journal,{...args,revision:journal.revision,parameters:{...parameters,depth:i+1},after:i+2});assert.equal(journal.entries.length,64);
 const undo=planSelectedProfileDepthTravel(journal,{...args,revision:journal.revision,direction:'undo',parameters:{...parameters,depth:71}});const next=recordSelectedProfileDepthEdit(undo.next,{...args,revision:undo.next.revision,parameters:{...parameters,depth:70},after:80});assert.equal(next.entries.length,64);assert.equal(next.cursor,64);assert.equal(next.entries.at(-1).after,80);
});

test('selected identity retention charges both UTF-8 and browser string memory',()=>{const journal=recordSelectedProfileDepthEdit(emptyAuthoredEditJournal(2,0),{...args,parameters:{...parameters,regionId:'sketch-region:'+ '界'.repeat(2000)}}),entry=journal.entries[0],text=JSON.stringify(entry.identity);assert.equal(entry.byteSize,256+Math.max(2*text.length,new TextEncoder().encode(text).byteLength));assert(entry.byteSize>2*text.length+256);});
