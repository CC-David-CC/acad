import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyAuthoredEditJournal,recordPhysicalTransaction,planPhysicalTravel} from '../../web/app/cad/craft/authoredEditJournal.mjs';
test('legacy source format stays explicit even when both exact sources are empty',()=>{
 const journal=recordPhysicalTransaction(emptyAuthoredEditJournal(1,0),{document:1,revision:0,beforeSource:'',afterSource:'',changes:[],sketches:[{faceId:'source-plane',before:'before',after:'after'}],parameterKind:'legacy-numeric-v1'});
 assert.equal(journal.entries[0].parameterKind,'legacy-numeric-v1');
 const undo=planPhysicalTravel(journal,{document:1,revision:1,direction:'undo',currentSource:'',history:[],readSketch:()=> 'after'});
 assert.equal(undo.parameterKind,'legacy-numeric-v1');assert.deepEqual(undo.sketches,[{faceId:'source-plane',data:'before'}]);
 assert.throws(()=>recordPhysicalTransaction(emptyAuthoredEditJournal(1,0),{document:1,revision:0,beforeSource:'a',afterSource:'b',changes:[],parameterKind:'unknown'}),/format/);
});
