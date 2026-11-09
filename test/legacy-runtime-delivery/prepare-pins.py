#!/usr/bin/env python3
"""SOURCE-ONLY prepared metadata extension; root may later execute offline.
Stream verifies four EXISTING staged files. No application/Native/browser calls.
"""
import argparse,copy,hashlib,json
from pathlib import Path
SOURCE='4a65a67d104d9866580d3bd1681ae960476343c2'
DESKTOP='78cc1694eca1a88623f33e7ff748673c909a6017'
BUNDLE='fc268f4051e8284ded0ad9c9ae8f830c35cb7a63425f6a8cfaf250898f3ac258'
OUTER='79a29a1f8c13d1536d3ce48c22c2243bb1b748f8f1f5acc082b21ad89fa93113'
CATALOG='930d7ce1b99a4189a02d79e5927f18e334a8ea440d9f40f6747594df6f5621b9'
FILES={
 'static/occ-portable.js':('a84b31900e58e61a1d7e3f8d04978408455764ad149923359e7fba19d3d07884',307709),
 'static/07d763a05f35cd257501.wasm':('07d763a05f35cd257501d339d9087df63c65bcaeb51a4f4f80832e333892e12e',34989243),
 'static/oci-verified-worker.js':('789b9c98cc2eb0922b2520b85f2eff7fa3f7673202b2f6d7c488768ec0a80731',429078),
 'static/prism-semantic.d8809c51ac0e83bd11bf.js':('a15a165d7c1af614dead8233e8c6490c65058b27be5ff11f5444da9ee9a06c3d',2110407),
}
def need(ok,message):
 if not ok:raise ValueError(message)
def sha(raw):return hashlib.sha256(raw).hexdigest()
def prepare(pins_path,stage_path,out_path):
 pins_path=Path(pins_path).resolve();stage=Path(stage_path).resolve();out=Path(out_path).resolve()
 need(out!=pins_path and out!=stage/'apps.json','NEW output must preserve input/catalog')
 before_bytes=pins_path.read_bytes();before=json.loads(before_bytes);manifest_bytes=(stage/'apps.json').read_bytes();catalog=json.loads(manifest_bytes)
 need(sha(manifest_bytes)==CATALOG,'Exact reviewed catalog bytes required')
 need(catalog['version']=='codi-public-apps/2' and catalog['hostAPI']==2,'Reviewed catalog protocol')
 apps=[a for a in catalog['apps'] if a['id']=='jsketcher'];need(len(apps)==1,'One exact CAD catalog app');app=apps[0]
 app_path='assets/desktop/apps/jsketcher/'+BUNDLE+'/index.mjs'
 need(app['kind']=='browser' and app['bundleSHA256']==BUNDLE and app['sha256']==OUTER and app['path']==app_path,'Same reviewed catalog outer tuple')
 need(before['source']==SOURCE and before['desktop']==DESKTOP and before['outer']['bundleSHA256']==BUNDLE and before['outer']['sha256']==OUTER and before['outer']['path']==app_path,'Same producing source/Desktop/outer tuple')
 need(type(before['files']) is dict and len(before['files'])-len(set(before['files'])&set(FILES))==178,'Reviewed178 subset plus only matching four-entry dedup')
 core=stage/'apps'/'jsketcher'/BUNDLE/'node_modules'/'jsketcher-build'
 result=copy.deepcopy(before);verified=[]
 for relative,(digest,size) in FILES.items():
  record=app['files']['node_modules/jsketcher-build/'+relative]
  need(record['sha256']==digest and record['bytes']==size,'Exact catalog hash/length: '+relative)
  prior=result['files'].get(relative);need(prior is None or prior==digest,'Never replace a conflicting existing pin: '+relative)
  actual=hashlib.sha256();length=0
  with (core/relative).open('rb') as stream:
   while True:
    chunk=stream.read(1024*1024)
    if not chunk:break
    length+=len(chunk);need(length<=size,'Staged bytes exceed reviewed bound: '+relative);actual.update(chunk)
  need(length==size and actual.hexdigest()==digest,'Actual staged bytes must match catalog AND reviewed source pin: '+relative)
  result['files'][relative]=digest;verified.append({'path':relative,'sha256':digest,'bytes':length})
 for key,value in before.items():
  if key!='files':need(result[key]==value,'Preserve every old metadata field')
 for key,value in before['files'].items():need(result['files'][key]==value,'Preserve every existing pin')
 need(set(result['files'])==set(before['files'])|set(FILES),'Only the exact four entries may be added')
 output=(json.dumps(result,indent=2)+'\n').encode()
 # Root owns the destination. Exclusive creation preserves previous evidence;
 # no stage/input writes, service action or retry/fault injection occurs.
 with out.open('xb') as stream:stream.write(output)
 return {'status':'PINS_PREPARED_NOT_RUNTIME_QUALIFIED','source':SOURCE,'desktop':DESKTOP,'bundleSHA256':BUNDLE,'catalogSHA256':CATALOG,'inputSHA256':sha(before_bytes),'outputSHA256':sha(output),'beforeCount':len(before['files']),'afterCount':len(result['files']),'verifiedStagedFiles':verified,'output':str(out)}
if __name__=='__main__':
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--pins',required=True);parser.add_argument('--stage',required=True);parser.add_argument('--out',required=True);args=parser.parse_args();print(json.dumps(prepare(args.pins,args.stage,args.out),indent=2))
