#!/usr/bin/env python3
"""Assemble exact production Worker source with a research native runtime."""
import argparse,hashlib,json,shutil
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--source',type=Path,required=True);p.add_argument('--native-js',type=Path,required=True);p.add_argument('--wasm',type=Path,required=True);p.add_argument('--runtime',type=Path,required=True);p.add_argument('--out',type=Path,required=True);p.add_argument('--variant',choices=['line-frame','line-clean','centered-only'],default='line-frame');a=p.parse_args()
def check(f,h):
 if hashlib.sha256(f.read_bytes()).hexdigest()!=h:raise ValueError('pin mismatch: '+str(f))
worker=a.source/'modules/engine/mount/oci-verified-worker.js'
pins={'line-frame':('81996d394b9fd2fcd7b02a0448bf7968c2decc04969d2be7ace4512cbfc5620a','0e08888f09c34f79b858cefc2859cbb59fbea1af6505b04686343eac7f9efc5b'),'line-clean':('81996d394b9fd2fcd7b02a0448bf7968c2decc04969d2be7ace4512cbfc5620a','13617eda9a2118edfd1244b5d46523e7d9628a87ec995a0237b2b5cc58d532f2'),'centered-only':('89b3b85fb8afcfbdf343ec3f7f2ecf222067012d994cf9af6eb649ef30d9257b','c39793b8aff34dc548b57fee1d901219e372702a5005ef92dfdf94994c012897')}
for f,h in [(worker,'0e7b085b471eb44c334d27a16dc9f2047e2c8311a5e3ea952f2d91feaacae837'),(a.native_js,pins[a.variant][0]),(a.wasm,pins[a.variant][1])]:check(f,h)
if a.out.exists() or a.out.is_symlink():raise ValueError('fresh output required')
a.out.mkdir();static=a.out/'static';static.mkdir();(a.out/'lib').mkdir()
for name in ['fourCornerHolePlan.mjs','fourCornerHoleTopology.mjs','fourCornerHoleProvenance.mjs','boundedPrismBoundary.mjs','centeredHolePlan.mjs','centeredHoleTopology.mjs','profile-topology.mjs']:
 shutil.copyfile(a.source/'modules/engine/mount'/name,static/name)
for name in ['rectangleProfileRequest.mjs','authoredRegions.mjs','profilePlan.mjs']:
 shutil.copyfile(a.runtime/'static'/name,static/name)
sketch=list((a.runtime/'static').glob('sketch-solver.*.js'))
if len(sketch)!=1:raise ValueError('one sketch solver required')
shutil.copyfile(sketch[0],static/'sketch-worker.js');shutil.copyfile(a.runtime/'lib/verb.js',a.out/'lib/verb.js');shutil.copyfile(a.wasm,static/'engine.wasm')
s=worker.read_text();source=a.native_js.read_text();before='window.__OCI_EXCHANGE_VAL = null;\nwindow.__OCI_EXCHANGE = function(objStr) {\n  __OCI_EXCHANGE_VAL = JSON.parse(objStr);\n  console.log("EXCHANGE VALUE:");\n  console.log(__OCI_EXCHANGE_VAL);\n};';after='globalThis.__OCI_EXCHANGE_VAL = null;\nglobalThis.__OCI_EXCHANGE = function(objStr) {\n  globalThis.__OCI_EXCHANGE_VAL = JSON.parse(objStr);\n};';assert source.count(before)==1;glue=source.replace(before,after);gluehash=hashlib.sha256(glue.encode()).hexdigest()
needle="const [js,wasm] = await Promise.all([verifiedAsset(msg.manifest.js, 1048576),verifiedAsset(msg.manifest.wasm, 41943040)]);";assert s.count(needle)==1;s=s.replace(needle,"if(msg.manifest.js?.sha256!=="+json.dumps(gluehash)+") bad('Unexpected embedded JS identity'); const wasm=await verifiedAsset(msg.manifest.wasm,41943040);")
needle="const blob=URL.createObjectURL(new Blob([js], {type:'text/javascript'}));\n      try {importScripts(blob);} finally {URL.revokeObjectURL(blob);}";assert s.count(needle)==1;s=s.replace(needle,'runEmbeddedRuntime();')
names=['_malloc','_free','lengthBytesUTF8','stringToUTF8Array','HEAP8','str2C'];s+='\nfunction runEmbeddedRuntime(){\nvar Module=self.Module;\n'+glue+'\n'+''.join('Object.defineProperty(self,'+json.dumps(n)+',{configurable:true,get:()=>'+n+'});\n' for n in names)+'self.Module=Module;\n}\n'
(static/'worker.js').write_text(s)
needle="callProfile('ttranslate',[tool,c.center[0],c.center[1],c.center[2]-plan.margin]);";assert s.count(needle)==1
(static/'worker-partial.js').write_text(s.replace(needle,"callProfile('ttranslate',[tool,c.center[0]+(i===3?100000:0),c.center[1],c.center[2]-plan.margin]);"))
(a.out/'index.html').write_text('<!doctype html><title>Disposable four-corner worker</title>');print(json.dumps({'workerSHA256':hashlib.sha256(s.encode()).hexdigest(),'glueSHA256':gluehash}))
