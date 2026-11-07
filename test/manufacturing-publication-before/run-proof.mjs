import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=new URL('../..',import.meta.url).pathname,dir=path.join(root,'test/manufacturing-publication-before'),output=process.env.CODI_METADATA_EVIDENCE_DIR||path.join(dir,'evidence/current');fs.mkdirSync(output,{recursive:true});
const names=['web/app/cad/craft/craftBundle.ts','web/app/cad/craft/authoredEditJournal.mjs','web/app/cad/projectManager/projectManagerBundle.ts','web/app/cad/projectManager/enclosureMaterialAssignment.mjs','web/app/cad/projectManager/genericManufacturingAssignment.mjs','web/app/cad/projectManager/incrementalCanonical.mjs','web/app/cad/projectManager/projectEnvelope.mjs','web/app/cad/projectManager/projectValidationWorker.ts','test/generic-manufacturing-assignment/manager-fixture.mjs','test/generic-manufacturing-assignment/capture-model-fixture.mjs',...fs.readdirSync(dir).filter(n=>n.endsWith('.mjs')||n.endsWith('.cjs')).map(n=>'test/manufacturing-publication-before/'+n)];
const hash=()=>Object.fromEntries(names.map(n=>[n,createHash('sha256').update(fs.readFileSync(path.join(root,n))).digest('hex')])),before=hash(),results={};
for(const [label,file] of [['controls','controls.test.mjs'],['regressions','regressions.test.mjs']]){
 const r=spawnSync(process.execPath,['--test',path.join(dir,file)],{cwd:root,encoding:'utf8',env:{...process.env,CODI_METADATA_EVIDENCE_DIR:output}});fs.writeFileSync(path.join(output,label+'.log'),r.stdout+r.stderr);results[label]={exit:r.status,signal:r.signal,summary:(r.stdout+r.stderr).split('\n').filter(s=>/^(ℹ (tests|pass|fail|skipped)|✖ )/.test(s))};
}
const after=hash(),receipt={scope:'actual manager/Craft functions plus real hash/validation Workers and explicit protocol accepted-state/replay; NOT native geometry or signed app proof',base:'8b8adfc7b',node:process.version,status:results.controls.exit===0&&results.regressions.exit!==0?'BEFORE_CONFIRMED_GAPS':'CHECK_RESULTS',results,sourceUnchanged:JSON.stringify(before)===JSON.stringify(after),sourceHashesBefore:before,sourceHashesAfter:after,compiledRuntime:JSON.parse(fs.readFileSync(path.join(root,'.build/manufacturing-publication-before/pins.json'))),compiledService:JSON.parse(fs.readFileSync(path.join(root,'.build/generic-manufacturing-assignment/pins.json'))),validationWorkerSHA256:createHash('sha256').update(fs.readFileSync(path.join(root,'.build/display-units/validation/worker.js'))).digest('hex')};
fs.writeFileSync(path.join(output,'receipt.json'),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({status:receipt.status,results,sourceUnchanged:receipt.sourceUnchanged},null,2));
// BEFORE expectations intentionally remain red; never convert absent shared
// publication to a passing product gate merely because it was reproduced.
process.exitCode=!receipt.sourceUnchanged?2:results.controls.exit||results.regressions.exit||0;
