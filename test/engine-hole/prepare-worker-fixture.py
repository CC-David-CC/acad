#!/usr/bin/env python3
"""Build a disposable strict-CSP research fixture from exact public inputs."""
import argparse,hashlib,pathlib,shutil,subprocess
root=pathlib.Path(__file__).resolve().parents[2];p=argparse.ArgumentParser();p.add_argument('--js',type=pathlib.Path,required=True);p.add_argument('--wasm',type=pathlib.Path,required=True);p.add_argument('--dist',type=pathlib.Path,required=True);p.add_argument('--node',type=pathlib.Path,required=True);p.add_argument('--out',type=pathlib.Path,required=True);a=p.parse_args()
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def check(p,h):
 if sha(p)!=h:raise ValueError('Input pin changed: '+str(p))
check(a.js,'89b3b85fb8afcfbdf343ec3f7f2ecf222067012d994cf9af6eb649ef30d9257b');check(a.wasm,'c39793b8aff34dc548b57fee1d901219e372702a5005ef92dfdf94994c012897')
bootstrap=root/'modules/engine/mount/oci-verified-worker.js';check(bootstrap,'0e7b085b471eb44c334d27a16dc9f2047e2c8311a5e3ea952f2d91feaacae837')
if a.out.exists() or a.out.is_symlink():raise ValueError('Fresh output required')
a.out.mkdir();out=a.out.resolve();(out/'static').mkdir();(out/'lib').mkdir()
wrapper=(root/'modules/engine/mount/build-headless-wrapper.mjs').read_text();(out/'wrapper.mjs').write_text(wrapper)
subprocess.run([str(a.node),str(out/'wrapper.mjs'),str(a.js.resolve()),str(out/'portable.js')],check=True);check(out/'portable.js','f74142622c9ced56b8f2e7955301ace5902f811734a71128767fb05de4159972')
embed=(root/'build/embedded-oci-worker.cjs').read_text();(out/'embed.cjs').write_text(embed)
code="const f=require('fs'),e=require(process.argv[1]);f.writeFileSync(process.argv[4],e.embeddedWorker(f.readFileSync(process.argv[2],'utf8'),f.readFileSync(process.argv[3],'utf8')))"
subprocess.run([str(a.node),'-e',code,str(out/'embed.cjs'),str(bootstrap),str(out/'portable.js'),str(out/'static/worker.js')],check=True)
s=(out/'static/worker.js').read_text();old="callProfile('ttranslate',[tool,plan.center[0],plan.center[1],plan.center[2]-plan.margin]);";new="callProfile('ttranslate',[tool,plan.center[0]+100000,plan.center[1],plan.center[2]-plan.margin]);"
if s.count(old)!=1:raise ValueError('No-op injection anchor changed')
(out/'static/worker-noop.js').write_text(s.replace(old,new));shutil.copyfile(a.wasm,out/'static/engine.wasm')
for name,pin in {'rectangleProfileRequest.mjs':'99959a7261da26a34120b6b59460c4c224ee0dbf04aa00577196b3e1b4ea6188','profilePlan.mjs':'610daacf923196789440d4460b76d11b864b169d4defc133bb62ea1b2e39c237','authoredRegions.mjs':'46368ba6ca386671afef5e8462e7827d803e02bd816fb1d3b35d7c9c3b9086e6','profile-topology.mjs':'700fc9fac9d73bf357d0bcba0599ac1dd44bfc81ca9eccd5464cfcdb64eb724b'}.items():
 src=a.dist/'static'/name;check(src,pin);shutil.copyfile(src,out/'static'/name)
workers=list((a.dist/'static').glob('sketch-solver.*.js'))
if len(workers)!=1:raise ValueError('One sketch Worker required')
check(workers[0],'75c0d7358f9278571ab5fffe69de77c1eb6df3227a4cc8bc7109f66cfb0587d0');shutil.copyfile(workers[0],out/'static/sketch-worker.js')
check(a.dist/'lib/verb.js','55f13091a656c635d1ebe3931a9b52236c65023549b7b69bc8278362f87686f3');shutil.copyfile(a.dist/'lib/verb.js',out/'lib/verb.js')
for name in ('enclosureManufacturingMesh.mjs','enclosureMesh.mjs','enclosurePlan.mjs','centeredHolePlan.mjs','centeredHoleTopology.mjs','boundedPrismBoundary.mjs','drilledTopologyEnvelope.mjs','worker-controller.mjs','fourCornerMountContract.mjs','oci-verified-mount.mjs','contract.mjs','portable-topology-envelope.mjs'):shutil.copyfile(root/'modules/engine/mount'/name,out/'static'/name)
(out/'index.html').write_text('<!doctype html><title>Disposable centered hole fixture</title>')
print(out)
