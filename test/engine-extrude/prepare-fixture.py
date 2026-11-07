#!/usr/bin/env python3
"""Assemble a local test fixture; no engine build, package or deployment."""
import argparse
from pathlib import Path
import shutil
import subprocess
p=argparse.ArgumentParser()
p.add_argument('--output',type=Path,required=True)
p.add_argument('--occ-js',type=Path,required=True)
p.add_argument('--occ-wasm',type=Path,required=True)
p.add_argument('--sketch-worker',type=Path,required=True)
p.add_argument('--verb',type=Path,required=True)
p.add_argument('--node',type=Path,required=True)
a=p.parse_args()
root=Path(__file__).resolve().parents[2]
a.output.mkdir(parents=True,exist_ok=False)
out=a.output.resolve();static=out/'static';static.mkdir();(out/'lib').mkdir();(out/'lib-assets/jsketcher-occ-engine').mkdir(parents=True)
source=root/'modules/engine/mount'
for name in ['enclosureManufacturingMesh.mjs','enclosureMesh.mjs','enclosurePlan.mjs','oci-verified-mount.mjs','manifold-verified-mount.mjs','worker-controller.mjs','fourCornerMountContract.mjs','contract.mjs','oci-verified-worker.js','inventory.mjs','oci-lifecycle-double.js','oci-crash-double.js','oci-operation-crash-double.js','profile-topology.mjs','portable-topology-envelope.mjs','drilledTopologyEnvelope.mjs','centeredHolePlan.mjs','centeredHoleTopology.mjs','boundedPrismBoundary.mjs']:
    shutil.copy2(source/name,static/name)
for name in ['rectangleProfileRequest.mjs','authoredRegions.mjs','profilePlan.mjs']:
    shutil.copy2(root/'modules/workbenches/modeler/features/extrude'/name,static/name)
shutil.copy2(root/'test/engine-extrude/forged-profile-worker.js',static/'forged-profile-worker.js')
worker=(source/'oci-verified-worker.js').read_text()
volume_marker='const expectedVolume=expectedPrismVolume(prepared.worldVertices,prepared.direction,prepared.depth);'
if worker.count(volume_marker)!=1:raise RuntimeError('Could not inject old volume negative control')
(static/'oci-profile-old-volume-double.js').write_text(worker.replace(volume_marker,'const a=prepared.edges[0],b=prepared.edges[1],expectedVolume=Math.hypot(a.b.x-a.a.x,a.b.y-a.a.y)*Math.hypot(b.b.x-b.a.x,b.b.y-b.a.y)*prepared.depth;'))
marker='function callProfile(command, args, success=0) {'
if worker.count(marker)!=1:raise RuntimeError('Could not inject test-only no-op')
(static/'oci-profile-noop-double.js').write_text(worker.replace(marker,marker+"\n  if(command==='prism' && args[0]==='m2')return; // test-only missing kernel write"))
history_marker='function readProductionHistory() {'
if worker.count(history_marker)!=1:raise RuntimeError('Could not inject test-only missing history')
(static/'oci-profile-nohistory-double.js').write_text(worker.replace(history_marker,history_marker+"\n  return {generated:[]}; // test-only missing kernel history"))
subprocess.run([str(a.node),str(source/'build-headless-wrapper.mjs'),str(a.occ_js.resolve(strict=True)),str(static/'occ-portable.js')],check=True)
shutil.copy2(a.occ_wasm.resolve(strict=True),out/'lib-assets/jsketcher-occ-engine/occt.wasm')
shutil.copy2(a.sketch_worker.resolve(strict=True),static/'sketch-worker.js')
shutil.copy2(a.verb.resolve(strict=True),out/'lib/verb.js')
(static/'engine-test.html').write_text('<!doctype html><title>OCC profile fixture</title>')
print(out)
