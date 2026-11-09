"""Negative-only own typed archive mutations; no positive source seed.
Retain all original number tokens/source/control/compressed spans. Update the
actual full geometry-source digest and dependent manifest, never fake metrics.
"""
import copy,hashlib,json,math,re,sys,zipfile,zlib,binascii
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'native-cad-container'))
from archive_oracle import read_archive,structure,rebuild,manifest_row,canonical,root_record
TYPE='WORKER_CENTERED_COUNTERSINK_V1';DOMAIN='codi-jsketcher-geometry-v1'
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
 project['sketches'].sort(key=lambda x:x['id'].encode('utf-16-be','surrogatepass'));need('authored/manufacturing.json' in raw,'actual assigned typed Save required');metadata=parse(raw['authored/manufacturing.json'])
 for key,value in (('model',project['model']),('manufacturing',metadata)):need(tokens(value)==raw['authored/'+key+'.json'],'original exact canonical metadata/number spellings')
 revision='sha256-'+sha(tokens({'kind':DOMAIN,'project':project}));need(metadata['revision']==revision,'independent full ORIGINAL source hash binds real accepted metadata');return info,raw,project,metadata,revision

def change(project,receipt,name):
 saved=[s for s in receipt['saves'] if s['label']=='typed'];need(len(saved)==1,'genuine complete typed Save');saved=saved[0];b=saved['binding'];history=project['model']['history'];indices=[i for i,r in enumerate(history) if r['type']==TYPE];need(len(indices)==1,'one actual semantic countersink');i=indices[0];p=history[i]['params'];need(str(p['featureId'])==str(b['countersink']['featureId']) and p['throughDiameter']=='shank' and p['entryDiameter']=='head' and p['includedAngleRadians']=='angle','actual typed raw countersink fields')
 if name=='angle-zero':return ('model','history',i,'params','includedAngleRadians'),Number('0'),'INVALID_REQUEST'
 if name=='angle-type':return ('model','history',i,'params','includedAngleRadians'),{'value':Number('1')},'INVALID_REQUEST'
 if name=='diameter-order':return ('model','history',i,'params','entryDiameter'),'shank','COUNTERSINK_DIAMETER_ORDER'
 if name=='nominal-depth-equality':
  rows=[j for j,r in enumerate(history) if r['type']=='WORKER_SELECTED_PROFILE_EXTRUDE_V2' and str(r['params']['featureId'])==str(b['profile']['featureId'])];need(len(rows)==1 and history[rows[0]]['params']['depth']=='plate','actual original named parent');e=saved['dimensions'];need(e['throughDiameter']==6 and e['entryDiameter']==10 and e['angleDegrees']==90 and e['thickness']==25,'frozen nominal2 conical depth fixture');return ('model','history',rows[0],'params','depth'),Number('2'),'COUNTERSINK_DEPTH_NOT_INTERIOR'
 need(name=='wrong-entry','one finite negative kind');body=saved['before']['capture']['solids']['bodies'];need(len(body)==1,'actual current typed result');rows=[r['id'] for r in body[0]['selections']['plan']['faces'] if r['role']=='first-cap' and r['originFeatureId']==b['profile']['featureId']];need(len(rows)==1 and rows[0]!=p['entryFaceId']==b['countersink']['entryFaceId'],'actual distinct wrong-role cap, no ID grammar');return ('model','history',i,'params','entryFaceId'),rows[0],'COUNTERSINK_ENTRY_UNRESOLVED'
def set_value(project,where,value):
 target=project
 for key in where[:-1]:target=target[key]
 target[where[-1]]=value

def inspect(base,file,receipt,name):
 before,a,old,metadata,revision=capture(base);after,b,new,changed,newRevision=capture(file);need(list(a)==list(b) and {key for key in a if a[key]!=b[key]}=={'authored/model.json','authored/manufacturing.json','manifest.json'},'ONLY original model/material revision/manifest changed');where,value,code=change(old,receipt,name);expected=copy.deepcopy(old);set_value(expected,where,value);need(diff(old,new)==[where] and new==expected,'exact one requested original authored-field delta, all other source/control/numbers/formulas/IDs exact');need(diff(metadata,changed)==[('revision',)] and changed['revision']==newRevision and newRevision!=revision,'only actual domain-separated geometry source revision changes, NO fabricated metrics/association')
 expected=copy.deepcopy(before['manifest'])
 for d in expected['entries']:
  if d['path'] in ('authored/model.json','authored/manufacturing.json'):d.update(bytes=len(b[d['path']]),sha256=sha(b[d['path']]))
 expected['designRevision']=sha(canonical(root_record(expected)));need(after['manifest']==expected,'only dependent original descriptors/root hash');oldRows,newRows=structure(Path(base).read_bytes()),structure(Path(file).read_bytes());need([x['path'] for x in oldRows]==[x['path'] for x in newRows],'original complete member order');need(all(x==y for x,y in zip(oldRows,newRows) if x['path'] not in ('authored/model.json','authored/manufacturing.json','manifest.json')),'ALL unrelated actual compressed/local spans exact');return{'negativeOnly':True,'name':name,'code':code,'baseSha256':before['sha256'],'negativeSha256':after['sha256'],'beforeGeometryRevision':revision,'afterGeometryRevision':newRevision,'path':list(where),'changedEntries':['authored/model.json','authored/manufacturing.json','manifest.json'],'numericPolicy':'verbatim-original-JSON-number-tokens, only explicit negative0/2/object1 introduced','depthPolicy':'nominal2 equality is actually noninterior with represented full90/tan; no nice-number snapping'}
def make(base,receiptFile,out):
 receipt=json.loads(Path(receiptFile).read_text());saved=[s for s in receipt['saves'] if s['label']=='typed'];need(len(saved)==1 and Path(base).read_bytes()==(Path(receiptFile).parent/saved[0]['savedFile']).read_bytes(),'derive ONLY actual saved typed bytes in this whole');info,raw,original,metadata,revision=capture(base);out=Path(out);out.mkdir(parents=True,exist_ok=False);result=[]
 for name in ('angle-zero','angle-type','diameter-order','nominal-depth-equality','wrong-entry'):
  project=copy.deepcopy(original);where,value,code=change(project,receipt,name);set_value(project,where,value);need(diff(original,project)==[where],'one explicit negative field');revised=copy.deepcopy(metadata);revised['revision']='sha256-'+sha(tokens({'kind':DOMAIN,'project':project}));replacements={'authored/model.json':tokens(project['model']),'authored/manufacturing.json':tokens(revised)};rows=[dict(x) for x in structure(Path(base).read_bytes())];manifest=copy.deepcopy(info['manifest'])
  for key,body in replacements.items():
   row=[r for r in rows if r['path']==key];entry=[r for r in manifest['entries'] if r['path']==key];need(len(row)==len(entry)==1,'one actual original role');codec=zlib.compressobj(6,zlib.DEFLATED,-15);row[0].update(bytes=len(body),crc=binascii.crc32(body)&0xffffffff,compressed=codec.compress(body)+codec.flush());entry[0].update(bytes=len(body),sha256=sha(body))
  manifest['designRevision']=sha(canonical(root_record(manifest)));rows[-1]=manifest_row(manifest);file=out/(name+'.cad');file.write_bytes(rebuild(rows));result.append({'name':name,'path':str(file),'code':code,'proof':inspect(base,file,receipt,name)})
 return result
if __name__=='__main__':
 need(len(sys.argv)==5 and sys.argv[1]=='make','make ACTUAL_TYPED_SAVE RECEIPT NEW_DIR');print(json.dumps(make(sys.argv[2],sys.argv[3],sys.argv[4])))
