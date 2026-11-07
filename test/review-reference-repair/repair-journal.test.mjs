import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyAuthoredEditJournal,recordCenteredParentRepair,planCenteredParentRepairTravel} from '../../web/app/cad/craft/authoredEditJournal.mjs';
test('parent repair records bounded identities and requires exact travel target',()=>{
 const empty=emptyAuthoredEditJournal(3,0);
 const edited=recordCenteredParentRepair(empty,{document:3,revision:0,index:2,featureId:7,before:'old-face',after:'new-face'});
 assert.equal(empty.entries.length,0);assert.ok(Object.isFrozen(edited.entries[0]));
 assert.throws(()=>planCenteredParentRepairTravel(edited,{document:3,revision:1,direction:'undo',index:2,featureId:7,currentFace:'wrong'}));
 const undo=planCenteredParentRepairTravel(edited,{document:3,revision:1,direction:'undo',index:2,featureId:7,currentFace:'new-face'});
 assert.equal(undo.face,'old-face');const redo=planCenteredParentRepairTravel(undo.next,{document:3,revision:2,direction:'redo',index:2,featureId:7,currentFace:'old-face'});assert.equal(redo.face,'new-face');
 assert.throws(()=>recordCenteredParentRepair(empty,{document:3,revision:0,index:2,featureId:7,before:'x',after:'x'.repeat(1025)}));
});
