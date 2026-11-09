#!/usr/bin/env python3
"""Prepared offline178→228 source-cohort pin extension; NOT executed here.
No browser/Worker/Native/build calls. Root owns invocation and NEW destination.
"""
import argparse,copy,hashlib,json
from pathlib import Path
SOURCE='b3a7bb227da38524309e8cc0c6c8a8646d00b854'
DESKTOP='78cc1694eca1a88623f33e7ff748673c909a6017'
BUNDLE='ed8d72d1975c69318bc297255ff3d38a54624b024e74cb4c0c8f744a8ef89ceb'
OUTER='79a29a1f8c13d1536d3ce48c22c2243bb1b748f8f1f5acc082b21ad89fa93113'
CATALOG='2318c6c29f533ede112ac769f2ae30afd77784b21ac99a7f1153d3395bb73739'
RECORDS_SHA='a6fc13f65062df3ec1f44d810974bae2b7cba5da0ac03219c259077eadc7cfe6'
NATIVE={
 'static/revolve-profile/revolve-profile-occ-portable.js':('567419c13c78fff46cbc9cd07e5a993106b652a13cb9f6944831f68ef48729cc',310560),
 'static/revolve-profile/revolve-profile-occ.wasm':('ad9475c81ea2eecadd41c73f0b0860d7d06c53e4292b16047472f03995f3efdd',35175631),
 'static/sweep-profile/sweep-profile-occ-portable.js':('a9cfa6e53a8bc14f2fb035e33afd1a82d9ae36ace1cf9f66169c739d2de72580',310656),
 'static/sweep-profile/sweep-profile-occ.wasm':('e105bdfe7c7bcb113eee5398d8202831cb8e8b1608dcc1730fc4461c9f24263d',35204120),
}
def need(ok,message):
 if not ok:raise ValueError(message)
def sha(raw):return hashlib.sha256(raw).hexdigest()
def prepare(pins_path,stage_path,out_path):
 pins_path=Path(pins_path).resolve();stage=Path(stage_path).resolve();out=Path(out_path).resolve();record_path=Path(__file__).with_name('b3a7-catalog-records.json').resolve()
 need(out not in (pins_path,stage/'apps.json',record_path),'NEW output preserves all inputs')
 record_bytes=record_path.read_bytes();need(sha(record_bytes)==RECORDS_SHA,'Exact frozen50 catalog records');frozen=json.loads(record_bytes)
 need({k:frozen[k] for k in ('source','desktop','bundleSHA256','outerSHA256','catalogSHA256')}=={'source':SOURCE,'desktop':DESKTOP,'bundleSHA256':BUNDLE,'outerSHA256':OUTER,'catalogSHA256':CATALOG},'Frozen source/catalog tuple')
 entries=frozen['entries'];need(len(entries)==50 and sum(v['bytes'] for v in entries.values())==74251690,'Exact bounded50-file cohort')
 need(sum(p.startswith('static/revolve-profile/') for p in entries)==23 and sum(p.startswith('static/sweep-profile/') for p in entries)==26 and 'static/prism-semantic.d8809c51ac0e83bd11bf.js' in entries,'Exact23revolve/26sweep/sharedsemantic closure')
 for relative,(digest,size) in NATIVE.items():need(entries[relative]=={'sha256':digest,'bytes':size},'Retain explicit historical engine pair')
 before_bytes=pins_path.read_bytes();before=json.loads(before_bytes);catalog_bytes=(stage/'apps.json').read_bytes();need(sha(catalog_bytes)==CATALOG,'Actual catalog is exact reviewed current delivery');catalog=json.loads(catalog_bytes)
 need(catalog['version']=='codi-public-apps/2' and catalog['hostAPI']==2,'Reviewed catalog protocol');apps=[a for a in catalog['apps'] if a['id']=='jsketcher'];need(len(apps)==1,'One CAD app');app=apps[0];app_path='assets/desktop/apps/jsketcher/'+BUNDLE+'/index.mjs'
 need(app['kind']=='browser' and app['bundleSHA256']==BUNDLE and app['sha256']==OUTER and app['path']==app_path,'Actual current catalog outer tuple')
 need(before['source']==SOURCE and before['desktop']==DESKTOP and before['outer']['bundleSHA256']==BUNDLE and before['outer']['sha256']==OUTER and before['outer']['path']==app_path,'Current producing input source/Desktop/outer tuple')
 need(type(before['files']) is dict and len(before['files'])-len(set(before['files'])&set(entries))==178,'Exact178 base plus matching current records only')
 core=stage/'apps'/'jsketcher'/BUNDLE/'node_modules'/'jsketcher-build';result=copy.deepcopy(before);verified=[]
 for relative,expected in entries.items():
  need(app['files']['node_modules/jsketcher-build/'+relative]==expected,'Exact actual catalog record: '+relative)
  prior=result['files'].get(relative);need(prior is None or prior==expected['sha256'],'Never replace conflicting old pin: '+relative)
  digest=hashlib.sha256();length=0
  with (core/relative).open('rb') as stream:
   while True:
    chunk=stream.read(1024*1024)
    if not chunk:break
    length+=len(chunk);need(length<=expected['bytes'],'Actual staged byte bound: '+relative);digest.update(chunk)
  need(length==expected['bytes'] and digest.hexdigest()==expected['sha256'],'Staged bytes equal catalog AND frozen source record: '+relative)
  result['files'][relative]=expected['sha256'];verified.append({'path':relative,**expected})
 for key,value in before.items():
  if key!='files':need(result[key]==value,'Preserve existing metadata field')
 for key,value in before['files'].items():need(result['files'][key]==value,'Preserve every old pin')
 need(set(result['files'])==set(before['files'])|set(entries) and len(result['files'])==228,'Only exact50 entries; deduplicated228 total')
 output=(json.dumps(result,indent=2)+'\n').encode()
 with out.open('xb') as stream:stream.write(output)
 return {'status':'PINS_PREPARED_NOT_RUNTIME_QUALIFIED','source':SOURCE,'desktop':DESKTOP,'bundleSHA256':BUNDLE,'catalogSHA256':CATALOG,'recordsSHA256':RECORDS_SHA,'inputSHA256':sha(before_bytes),'outputSHA256':sha(output),'beforeCount':len(before['files']),'afterCount':len(result['files']),'verifiedStagedFiles':verified,'verifiedBytes':sum(v['bytes'] for v in verified),'output':str(out)}
if __name__=='__main__':
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--pins',required=True);parser.add_argument('--stage',required=True);parser.add_argument('--out',required=True);args=parser.parse_args();print(json.dumps(prepare(args.pins,args.stage,args.out),indent=2))
