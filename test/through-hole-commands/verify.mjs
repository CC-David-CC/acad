// Routing/custody only: genuine admission modules, explicit model/service doubles.
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),out=new URL('./evidence/',import.meta.url);
const files=['web/app/cad/craft/workerThroughHoleCommands.ts','test/through-hole-commands/fixture.cjs','test/through-hole-commands/coordinator.test.cjs','web/app/cad/craft/workerEdgeTreatmentCommands.ts','test/edge-treatment-commands/fixture.cjs','test/edge-treatment-commands/coordinator.test.cjs','modules/engine/solid/ownedHoleIntent.mjs','modules/engine/mount/engineCatalog.mjs','modules/engine/mount/selectedProfileBudget.mjs','modules/engine/mount/selectedProfileBuildSelection.mjs','modules/engine/solid/solidOperandRuntime.mjs','web/app/cad/craft/authoredEditJournal.mjs','web/app/cad/craft/sketchRevision.mjs'];
const hashes=()=>Object.fromEntries(files.map(f=>[f,createHash('sha256').update(readFileSync(new URL('../../'+f,import.meta.url))).digest('hex')]));
const before=hashes();
function run(args,name){const r=spawnSync(process.execPath,args,{cwd:root,encoding:'utf8',maxBuffer:2*1024*1024});writeFileSync(new URL(name,out),(r.stdout||'')+(r.stderr||''));assert.ifError(r.error);assert.equal(r.status,0,name);return r.stdout;}
const through=run(['--test','--test-reporter=tap','test/through-hole-commands/coordinator.test.cjs'],'qualified-source.tap');assert.match(through,/# tests 22\b/);assert.match(through,/# fail 0\b/);
const edge=run(['--test','--test-reporter=tap','test/edge-treatment-commands/coordinator.test.cjs'],'qualified-retained.tap');assert.match(edge,/# tests 18\b/);assert.match(edge,/# fail 0\b/);
const require=createRequire(import.meta.url),tsc=require.resolve('typescript/bin/tsc');run([tsc,'--noEmit'],'qualified-typescript.log');assert.deepEqual(hashes(),before);
writeFileSync(new URL('receipt.json',out),JSON.stringify({version:1,status:'PASS',scope:'through-hole-public-facade-routing-and-custody-only',source:'e00af8306',node:process.version,typescript:require('typescript').version,tests:{new:22,retained:18,failed:0,skipped:0},typescriptCheck:{status:'PASS',noEmit:true},sourceHashesBeforeAndAfter:before,limits:['Service/model/publication/selection doubles; no successful fake output presented as native geometry','No sketch solve, native Worker, browser, signed host, file or genuine journal travel qualification','Creation admissibility requires actual Worker source/layout/output validation','No default/kernel/native assets changed']},null,2)+'\n');
console.log('PASS22through-hole facade controls +18retained edge controls +repositoryTSC.');
