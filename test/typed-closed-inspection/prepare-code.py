"""Code-only private build prerequisites from the independently pinned R4 package."""
import hashlib,json,shutil
from pathlib import Path
root=Path(__file__).resolve().parents[2];source=root/'.build/r4-code';static=source/'static';generated=root/'.build'
copies={
 'physical-parameters-worker/worker.js':'physical-parameters.80f9d436322dbee6fd01.js',
 'headless-sketch-worker/worker.js':'sketch-solver.bd9a5a96b8d7ede6919c.js',
 'prism-semantic-worker/worker.js':'prism-semantic.334b28c725a9ef9b0d97.js',
 'manufacturing-hash-worker/worker.js':'manufacturing-hash.b9be312ee7d9ee44402a.js',
 'typed-inspection-project-worker/worker.js':'project-validator.760e8f44baf4dc8db1a2.js',
 'raw-smlib-worker/raw-smlib-worker.js':'raw-smlib-worker.js','raw-smlib-worker/raw-provider.wasm':'f33f19cd0098b610756d.wasm',
 'prism-assets/occ.wasm':'07d763a05f35cd257501.wasm','prism-assets/manifold-worker.wasm':'7bb5f8ee10fcafdab787.wasm',
 'selected-profile-assets/selected-profile-worker.js':'selected-profile-worker.js','selected-profile-assets/selected-profile-occ-portable.js':'selected-profile-occ-portable.js','selected-profile-assets/selected-profile-occ.wasm':'a81af0b78dd585124f3f.wasm','selected-profile-assets/selectedProfilePlan.mjs':'selectedProfilePlan.mjs'}
for name in ['enclosurePlan.mjs','enclosureLabelContact.mjs','enclosureManufacturingMesh.mjs','enclosureMesh.mjs','profile-topology.mjs','rectangleProfileRequest.mjs','authoredRegions.mjs','profilePlan.mjs','centeredHolePlan.mjs','centeredHoleTopology.mjs','boundedPrismBoundary.mjs','fourCornerHolePlan.mjs','fourCornerHoleTopology.mjs','fourCornerHoleProvenance.mjs','manifold-verified-worker.js','oci-verified-worker.js','occ-portable.js']:copies['prism-assets/'+name]=name
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
pins={'sketch-solver.bd9a5a96b8d7ede6919c.js':'241267a8f24892743ec82beaf5bda00da962538b8bb445c3d02b6559d4583da9','project-validator.760e8f44baf4dc8db1a2.js':'7236c461672b662cf9d860439c99a3962784012f88245c248a771158f7287286','prism-semantic.334b28c725a9ef9b0d97.js':'b2978247c61a269ff5e8e2143dfdaca04221c3ee6e950e1336099f1bb440d2a3','index.bundle.js':'d78d53333222222404fcd030d187b655a24132f750a429b0fa55cbd9b8c1b319'}
for name,pin in pins.items():assert sha(static/name)==pin,name
for target,name in copies.items():p=generated/target;p.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(static/name,p)
dist=root/'dist';assert not dist.exists();shutil.copytree(source,dist)
(generated/'typed-inspection-inputs.json').write_text(json.dumps({'source':'R4 immutable code only; no service/account state','files':{target:sha(generated/target) for target in copies}},indent=2)+'\n')
print('Staged private code-only inputs; project Worker is private, shared node_modules cache untouched')
