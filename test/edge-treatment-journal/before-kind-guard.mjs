// Reproduce the real older shared-journal kind collision from full Git source,
// not a transformed function body, fake model or browser/solver environment.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
const sourceCommit='971fd8ea1',source=execFileSync('git',['show',sourceCommit+':web/app/cad/craft/authoredEditJournal.mjs'],{encoding:'utf8'}),m=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const parameters={version:1,unit:'millimeter',engine:'occ',engineRevision:'sha256:'+'a'.repeat(64)+':'+'b'.repeat(64),featureId:17,faceId:'plane',regionId:'sketch-region:fixture',depth:3,bodyPolicy:'separate'},args={document:4,revision:0,index:2,featureId:17};
const journal=m.recordSelectedProfileDepthEdit(m.emptyAuthoredEditJournal(4,0),{...args,parameters,after:2}),wrong=m.planExtrusionTravel(journal,{...args,revision:1,direction:'undo',currentDepth:2});assert.equal(journal.entries[0].kind,'selected-profile-depth');assert.equal(wrong.depth,3);
const result={status:'REPRODUCED_OLD_CROSS_KIND_ACCEPTANCE',scope:'Actual full Git-source pure journal execution only; no CAD/kernel/browser operation',sourceCommit,sourceSHA256:createHash('sha256').update(source).digest('hex'),actualEntryKind:journal.entries[0].kind,wrongTravelHelper:'planExtrusionTravel',returnedDepth:wrong.depth};
if(process.argv[2])writeFileSync(process.argv[2],JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
