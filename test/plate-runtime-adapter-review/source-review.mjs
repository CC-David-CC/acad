// Read-only contract inventory; no model authoring or native instantiation.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const groups={
 'modules/engine/extrusion/':['candidatePrismLedger.mjs','rectanglePrismAdapter.ts','centeredHoleAdapter.ts','fourCornerHoleAdapter.ts'],
 'modules/engine/solid/':['solidLedger.mjs','solidIntent.mjs'],
 'modules/engine/mount/':['engineCatalog.mjs','occ-mechanical-profile-mount.mjs','worker-controller.mjs','oci-verified-worker.js','centeredHolePlan.mjs','fourCornerHolePlan.mjs','selectionAncestryIndex.mjs','selectedProfileBudget.mjs','polygonProfilePlan.mjs','ownedTopologyContract.mjs','prismSelectionIndex.mjs'],
 'web/app/cad/craft/':['selectedProfileCommands.ts','workerFeatureCommands.ts','workerEdgeTreatmentCommands.ts','unconsumedSketchSave.mjs'],
 'web/app/cad/parameters/':['physicalBindingFields.mjs','authoredPhysicalManifest.mjs'],
 'modules/workbenches/modeler/features/workerSelectedProfile/':['workerSelectedProfile.operation.ts'],
 'modules/workbenches/modeler/features/workerCenteredHole/':['workerCenteredHole.operation.ts'],
 'modules/workbenches/modeler/features/workerFourCornerHole/':['workerFourCornerHole.operation.ts'],
 'test/mechanical-profile-browser/':['product-source-mapping.json','evidence-r1/receipt.json']
};
const files=Object.entries(groups).flatMap(([p,names])=>names.map(n=>p+n));
const sources=Object.fromEntries(files.map(p=>[p,fs.readFileSync(p,'utf8')]));
const byName=n=>Object.entries(sources).find(([p])=>p.endsWith('/'+n))[1];
const checks=[['candidatePrismLedger.mjs',"MOUNT_KEY='occ-prism-v1'"],['solidLedger.mjs',"owner.getOrCreateMount('worker-solid:'+intent.engine"],['solidLedger.mjs','NO_AUTHORED_PRISM_SELECTIONS'],['occ-mechanical-profile-mount.mjs','profile:false,selectedProfile:true,selectedProfileVersion:3,edgeTreatments:true'],['worker-controller.mjs','if (fourCornerCut && (!centeredCut || !fourHoleRuntime))'],['oci-verified-worker.js','Unsupported selected-owned operation'],['oci-verified-worker.js','_PerformDrilledCutV1'],['oci-verified-worker.js','_ResearchFourCornerCut'],['selectionAncestryIndex.mjs',"['fillet','chamfer-equal']"],['polygonProfilePlan.mjs',"curves[0].kind==='circle'"],['ownedTopologyContract.mjs',"if(loop.kind==='circle')return"],['receipt.json','actual-circle']];
for(const[n,s]of checks)assert.ok(byName(n).includes(s),n+': '+s);
assert.equal(/captureSolid(?:Centered|FourCorner|Hole)/.test(byName('solidLedger.mjs')),false);
assert.equal(byName('selectedProfileBudget.mjs').split('\n').find(s=>s.startsWith('const genericTypes=')).includes('THROUGH_HOLE'),false);
assert.equal(byName('physicalBindingFields.mjs').includes('WORKER_SELECTED_PROFILE_EXTRUDE_V2'),false);
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
console.log(JSON.stringify({status:'READ_ONLY_CONTRACT_CHECKS_PASS',scope:'Source assertions only; proposed adapter UNIMPLEMENTED; no geometry/app authoring',commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),checks:checks.length+3,sources:Object.fromEntries(files.map(p=>[p,sha(sources[p])]))},null,2));
