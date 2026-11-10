"""Negative-only own full-Arc archive mutations; no positive source seed.
Retain all original number tokens/source/control/compressed spans. Update the
actual full geometry-source digest and dependent manifest, never fake metrics.
"""
import copy,hashlib,json,math,re,sys,zipfile,zlib,binascii
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'native-cad-container'))
from archive_oracle import read_archive,structure,rebuild,manifest_row,canonical,root_record
DOMAIN='codi-jsketcher-geometry-v1'
sha=lambda x:hashlib.sha256(x).hexdigest()
def need(v,m):
 if not v:raise ValueError(m)
class Number(str):pass
def pairs(rows):
 out={}
 for k,v in rows:need(k not in out,'unique actual original JSON keys');out[k]=v
 return out
def parse(raw):return json.loads(raw.decode('utf-8'),parse_int=Number,parse_float=Number,parse_constant=lambda _:(_ for _ in ()).throw(ValueError('nonfinite original JSON')),object_pairs_hook=pairs)
def tokens(value,depth=0):
 need(depth<=256,'bounded negative-only JSON tree')
 if isinstance(value,Number):need(re.fullmatch(r'-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?',value) and math.isfinite(float(value)),'finite original number spelling');return value.encode('ascii')
 if isinstance(value,str):return json.dumps(value,ensure_ascii=False,separators=(',',':')).encode('utf-8')
 if value is None:return b'null'
 if type(value) is bool:return b'true' if value else b'false'
 if type(value) is list:return b'['+b','.join(tokens(x,depth+1) for x in value)+b']'
 need(type(value) is dict,'only original JSON data');return b'{'+b','.join(tokens(k)+b':'+tokens(value[k],depth+1) for k in sorted(value,key=lambda k:k.encode('utf-16-be','surrogatepass')))+b'}'
def diff(a,b,path=()):
 if type(a) is not type(b):return[path]
 if isinstance(a,dict):
  if set(a)!=set(b):return[path]
  return[p for k in sorted(a) for p in diff(a[k],b[k],path+(k,))]
 if isinstance(a,list):
  if len(a)!=len(b):return[path]
  return[p for i,(x,y) in enumerate(zip(a,b)) for p in diff(x,y,path+(i,))]
 return [] if a==b else [path]
def members(file):
 with zipfile.ZipFile(file) as z:need(z.testzip() is None,'actual archive CRC');return{r.filename:z.read(r) for r in z.infolist()}
def capture(file):
 info=read_archive(file);raw=members(file);project={'model':parse(raw['authored/model.json']),'sketches':[]}
 if 'authored/surfacing.json' in raw:project['surfacing']=parse(raw['authored/surfacing.json'])
 for entry in info['manifest']['entries']:
  if entry['role']=='sketch':project['sketches'].append({'id':entry['logicalId'],'data':parse(raw[entry['path']])})
 project['sketches'].sort(key=lambda x:x['id'].encode('utf-16-be','surrogatepass'));need('authored/manufacturing.json' in raw,'actual assigned native Save required');metadata=parse(raw['authored/manufacturing.json'])
 for key,value in (('model',project['model']),('manufacturing',metadata)):need(tokens(value)==raw['authored/'+key+'.json'],'original exact canonical metadata/number spellings')
 revision='sha256-'+sha(tokens({'kind':DOMAIN,'project':project}));need(metadata['revision']==revision,'independent full ORIGINAL source hash binds real accepted metadata');return info,raw,project,metadata,revision

NAMES=('missing-branch','unknown-branch','mismatched-full-seam')
def changed_project(original,receipt,name):
 need(name in NAMES,'finite negative-only branch cases');saved=one([s for s in receipt['saves']if s['case']=='full'and s['label']=='final'],'actual complete full Arc Save');face=saved['binding']['faceId'];curves=saved['binding']['curves'];arc=one([c for c in curves if c['type']=='Arc'],'actual saved full Arc identity');p=copy.deepcopy(original);row=one([s for s in p['sketches']if s['id']==face],'actual source face');obj=one([o for o in row['data']['objects']if o['id']==arc['id']and o['type']=='Arc'],'actual full Arc record')
 need(obj['data']['branch']=='full-ccw'and obj['data']['a']==obj['data']['b'],'genuine original full seam, no ID grammar')
 if name=='missing-branch':del obj['data']['branch']
 elif name=='unknown-branch':obj['data']['branch']='unknown'
 else:obj['data']['b']['x']=Number(str(-float(obj['data']['a']['x'])))
 return p,face
def one(xs,label):need(len(xs)==1,'one '+label);return xs[0]
def inspect(base,file,receipt,name):
 before,a,old,metadata,revision=capture(base);after,b,new,changed,newRevision=capture(file);expected,face=changed_project(old,receipt,name);entry=one([e for e in before['manifest']['entries']if e['role']=='sketch'and e['logicalId']==face],'actual original sketch descriptor');changed_paths={entry['path'],'authored/manufacturing.json','manifest.json'};need(list(a)==list(b)and{k for k in a if a[k]!=b[k]}==changed_paths,'ONLY actual own Arc source/material source revision/manifest changed');need(new==expected,'exact requested negative delta, all other original source/control/history/number spellings retained');need(diff(metadata,changed)==[('revision',)]and changed['revision']==newRevision and newRevision!=revision,'only domain-separated accepted-source revision changes, no fabricated geometry')
 m=copy.deepcopy(before['manifest'])
 for item in m['entries']:
  if item['path']in changed_paths-{'manifest.json'}:item.update(bytes=len(b[item['path']]),sha256=sha(b[item['path']]))
 m['designRevision']=sha(canonical(root_record(m)));need(after['manifest']==m,'only dependent actual descriptors/design digest');oldrows,newrows=structure(Path(base).read_bytes()),structure(Path(file).read_bytes());need([r['path']for r in oldrows]==[r['path']for r in newrows]and all(x==y for x,y in zip(oldrows,newrows)if x['path']not in changed_paths),'all other actual compressed/local spans exact');return{'negativeOnly':True,'name':name,'code':'INVALID_ARC_BRANCH','baseSha256':before['sha256'],'negativeSha256':after['sha256'],'changedEntries':sorted(changed_paths),'beforeGeometryRevision':revision,'afterGeometryRevision':newRevision,'numericPolicy':'verbatim original JSON number tokens; only explicit negative seam x introduced'}
def make(base,receipt_file,directory):
 receipt=json.loads(Path(receipt_file).read_text());saved=one([s for s in receipt['saves']if s['case']=='full'and s['label']=='final'],'real saved base');need(Path(base).read_bytes()==(Path(receipt_file).parent/saved['savedFile']).read_bytes(),'derive only actual complete normal Save');info,raw,original,metadata,revision=capture(base);directory=Path(directory);directory.mkdir(parents=False,exist_ok=False);result=[]
 for name in NAMES:
  project,face=changed_project(original,receipt,name);sketch=one([s for s in project['sketches']if s['id']==face],'actual changed source');entry=one([e for e in info['manifest']['entries']if e['role']=='sketch'and e['logicalId']==face],'actual descriptor');revised=copy.deepcopy(metadata);revised['revision']='sha256-'+sha(tokens({'kind':DOMAIN,'project':project}));replacements={entry['path']:tokens(sketch['data']),'authored/manufacturing.json':tokens(revised)};rows=[dict(r)for r in structure(Path(base).read_bytes())];m=copy.deepcopy(info['manifest'])
  for key,body in replacements.items():
   row=one([r for r in rows if r['path']==key],'actual ZIP row');desc=one([r for r in m['entries']if r['path']==key],'actual descriptor');codec=zlib.compressobj(6,zlib.DEFLATED,-15);row.update(bytes=len(body),crc=binascii.crc32(body)&0xffffffff,compressed=codec.compress(body)+codec.flush());desc.update(bytes=len(body),sha256=sha(body))
  m['designRevision']=sha(canonical(root_record(m)));rows[-1]=manifest_row(m);file=directory/(name+'.cad');file.write_bytes(rebuild(rows));result.append({'name':name,'path':str(file),'code':'INVALID_ARC_BRANCH','proof':inspect(base,file,receipt,name)})
 return result
if __name__=='__main__':
 need(len(sys.argv)==5 and sys.argv[1]=='make','make ACTUAL_FULL_SAVE RECEIPT NEW_DIRECTORY');print(json.dumps(make(sys.argv[2],sys.argv[3],sys.argv[4])))
