// Produce the reviewed worker inputs without changing the pinned OCI source.
const fs = require('fs');
const path = require('path');
const {execFileSync} = require('child_process');
const crypto = require('crypto');
const {embeddedWorker}=require('./embedded-oci-worker.cjs');
const root = path.resolve(__dirname, '..');
const out = path.join(root, '.build/prism-assets');
fs.rmSync(out, {recursive:true,force:true}); fs.mkdirSync(out, {recursive:true});
const copy = (source, name) => {
 let text=fs.readFileSync(path.join(root,source),'utf8');
 // This generated legacy directory is flat; canonical source stays separate.
 if(name==='sourceProjectionIntent.mjs')text=text.replace('../metadata/authoredFeatureIdentity.mjs','./authoredFeatureIdentity.mjs');
 if(name==='sourceFrameIntent.mjs')text=text.replace('../metadata/authoredFeatureIdentity.mjs','./authoredFeatureIdentity.mjs');
 if(name==='authoredRegions.mjs')text=text.replace('../../../../engine/mount/polygonProfilePlan.mjs','./polygonProfilePlan.mjs');
 if(name==='polygonProfilePlan.mjs')text=text.replace('../extrusion/simplePolygon.mjs','./simplePolygon.mjs').replace('../extrusion/exactExternalVertexContact.mjs','./exactExternalVertexContact.mjs');
 if(['selectedProfilePlan.mjs','ownedTopologyContract.mjs','arrangedPrismSelectionIndex.mjs'].includes(name))text=text.split('../extrusion/selectedArrangementDescriptor.mjs').join('./selectedArrangementDescriptor.mjs');
 fs.writeFileSync(path.join(out,name),text);
};

for (const name of ['exactMeshVolume.mjs','displayProjection.mjs','enclosureLabelContact.mjs','enclosureManufacturingMesh.mjs','enclosureMesh.mjs','enclosurePlan.mjs','profile-topology.mjs','centeredHolePlan.mjs','centeredHoleTopology.mjs','boundedPrismBoundary.mjs','fourCornerHolePlan.mjs','fourCornerHoleTopology.mjs','fourCornerHoleProvenance.mjs','selectedProfilePlan.mjs','polygonProfilePlan.mjs','ownedTopologyContract.mjs','arrangedPrismSelectionIndex.mjs']) copy('modules/engine/mount/'+name,name);
for (const name of ['rectangleProfileRequest.mjs','authoredRegions.mjs','profilePlan.mjs']) copy('modules/workbenches/modeler/features/extrude/'+name,name);
for(const name of ['sourceProjectionIntent.mjs','sourceFrameIntent.mjs'])copy('modules/engine/source/'+name,name);
copy('modules/engine/metadata/authoredFeatureIdentity.mjs','authoredFeatureIdentity.mjs');
copy('modules/engine/extrusion/simplePolygon.mjs','simplePolygon.mjs');
copy('modules/engine/extrusion/exactExternalVertexContact.mjs','exactExternalVertexContact.mjs');
copy('modules/engine/extrusion/selectedArrangementDescriptor.mjs','selectedArrangementDescriptor.mjs');
// Resource modules are served verbatim: emit their complete static import
// closure without evaluating a planner on the main thread.
const regionModules=[];let regionBytes=0;
function regionDependency(name){
 if(regionModules.includes(name))return;
 const file=path.resolve(out,name),relative=path.relative(out,file);
 if(relative.startsWith('..')||path.isAbsolute(relative)||path.basename(name)!==name||!/^[A-Za-z][A-Za-z0-9_-]*\.mjs$/.test(name)||regionModules.length>=64)throw Error('Unexpected legacy region dependency');
 const text=fs.readFileSync(file,'utf8');regionModules.push(name);
 if((regionBytes+=Buffer.byteLength(text))>1048576)throw Error('Legacy region module graph exceeds its bound');
 const imports=/\b(?:import|export)\s+(?:[^'";]*?\s+from\s*)?['"]([^'"]+)['"]/g;let match;
 while((match=imports.exec(text))){if(!match[1].startsWith('.'))throw Error('External legacy region dependency');regionDependency(path.relative(out,path.resolve(path.dirname(file),match[1])));}
}
regionDependency('authoredRegions.mjs');
regionDependency('arrangedPrismSelectionIndex.mjs');
regionDependency('sourceProjectionIntent.mjs');
const regionEntry=regionModules.map((name,i)=>`import p${i} from ${JSON.stringify('./prism-assets/'+name)};`).join('\n')+'\n'+
 `const paths=[${regionModules.map((_,i)=>'p'+i).join(',')}],directory=p0.slice(0,p0.lastIndexOf('/')+1);\n`+
 `if(paths.some(p=>p.slice(0,p.lastIndexOf('/')+1)!==directory))throw Error('Legacy region Worker modules are not colocated.');\nexport default p0;\n`;
fs.writeFileSync(path.join(root,'.build/prism-regions-entry.mjs'),regionEntry);
const wasm = path.join(root,'node_modules/.cache/codi-oci-census/main.wasm');
if (crypto.createHash('sha256').update(fs.readFileSync(wasm)).digest('hex') !== '07d763a05f35cd257501d339d9087df63c65bcaeb51a4f4f80832e333892e12e') throw Error('Unexpected pinned OCC WASM.');
fs.copyFileSync(wasm,path.join(out,'occ.wasm'));
execFileSync(process.execPath,[path.join(root,'modules/engine/mount/build-headless-wrapper.mjs'),path.join(root,'node_modules/.cache/codi-oci-census/main.js'),path.join(out,'occ-portable.js')],{stdio:'inherit'});

// Verify the canonical source before producing the generated legacy flat form.
const bootstrap=fs.readFileSync(path.join(root,'modules/engine/mount/oci-verified-worker.js'),'utf8');
const glue=fs.readFileSync(path.join(out,'occ-portable.js'),'utf8');
const combined=embeddedWorker(bootstrap,glue).split('../extrusion/selectedArrangementDescriptor.mjs').join('./selectedArrangementDescriptor.mjs');
fs.writeFileSync(path.join(out,'oci-verified-worker.js'),combined,{flag:'wx'});
console.log(JSON.stringify({embeddedWorkerSHA256:crypto.createHash('sha256').update(combined).digest('hex')}));
// Source-built Manifold glue is embedded; WASM is verified at runtime.
const {embeddedManifoldWorker}=require('./embedded-manifold-worker.cjs');
const manifoldJs=fs.readFileSync(path.join(root,'node_modules/.cache/codi-manifold/manifold.js'),'utf8');
const manifoldWasm=fs.readFileSync(path.join(root,'node_modules/.cache/codi-manifold/manifold.wasm'));
if(crypto.createHash('sha256').update(manifoldWasm).digest('hex')!=='7bb5f8ee10fcafdab78799b1e5dd2cdc7c282ea0bf8e7939c43f3ad34b823e3d')throw Error('Unexpected pinned Manifold WASM.');
const manifoldBootstrap=fs.readFileSync(path.join(root,'modules/engine/mount/manifold-verified-worker.js'),'utf8');
fs.writeFileSync(path.join(out,'manifold-verified-worker.js'),embeddedManifoldWorker(manifoldBootstrap,manifoldJs),{flag:'wx'});
fs.writeFileSync(path.join(out,'manifold-worker.wasm'),manifoldWasm,{flag:'wx'});
console.log(JSON.stringify({embeddedManifoldWorkerSHA256:crypto.createHash('sha256').update(fs.readFileSync(path.join(out,'manifold-verified-worker.js'))).digest('hex')}));
