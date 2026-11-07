#!/usr/bin/env python3
"""Create disposable self-only-CSP test assets, including corrupt WASM."""
import argparse
from pathlib import Path
import shutil
p=argparse.ArgumentParser();p.add_argument('--dist',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
dist=a.dist.resolve(strict=True);a.output.mkdir(parents=True,exist_ok=False)
root=a.output/'node_modules/jsketcher-build';static=root/'static';static.mkdir(parents=True);(root/'lib').mkdir()
for name in ['oci-verified-worker.js','profile-topology.mjs','rectangleProfileRequest.mjs','authoredRegions.mjs','profilePlan.mjs','occ-portable.js','c39793b8aff34dc548b5.wasm']:
 (static/name).symlink_to(dist/'static'/name)
workers=list((dist/'static').glob('sketch-solver.*.js'))
if len(workers)!=1:raise RuntimeError('Exactly one built sketch worker is required')
(static/'sketch-worker.js').symlink_to(workers[0]);(root/'lib/verb.js').symlink_to(dist/'lib/verb.js')
source=(dist/'static/oci-verified-worker.js').read_text();needle="    if (msg?.kind==='profile-extrude') {"
if source.count(needle)!=1:raise RuntimeError('Unexpected worker test-hook location')
hook="""    if (msg?.kind==='test-heap-growth') {
      const before=HEAP8.length, old=HEAP8.buffer, pointer=_malloc(before+65536);
      if(!pointer)bad('Growth allocation failed');const after=HEAP8.length, grown=HEAP8.buffer!==old, live=self.HEAP8===HEAP8;_free(pointer);
      self.postMessage({kind:'heap-test',before,after,grown,live});return;
    }
"""
(static/'oci-growth-test.js').write_text(source.replace(needle,hook+needle))
bad=static/'wasm-bad.wasm';shutil.copyfile(dist/'static/c39793b8aff34dc548b5.wasm',bad)
with bad.open('r+b') as f:f.seek(-1,2);last=f.read(1);f.seek(-1,2);f.write(bytes([last[0]^1]))
(a.output/'index.html').write_text('<!doctype html><title>Disposable embedded Worker fixture</title>')
print(a.output)
