"""Negative-only archive consistency and AFTER-WHOLE exact-diff proof.

No production module or geometry executor is imported. Original JSON number
tokens are retained verbatim: the only semantic mutation is a STRING leaf.
The independently reconstructed original project hash must first equal its
actual saved manufacturing revision. Thus this finite fixture never guesses
ECMAScript float formatting or rewrites source coordinates/accepted metrics.
"""
import copy,hashlib,json,math,re,zipfile,zlib,binascii
from pathlib import Path

DOMAIN='codi-jsketcher-geometry-v1'
NUMBER=re.compile(r'-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?\Z')
sha=lambda raw:hashlib.sha256(raw).hexdigest()

def need(ok,why):
 if not ok:raise ValueError(why)

class Number(str):
 """An original JSON number spelling, not a reserialized Python float."""

def pairs(rows):
 out={}
 for key,value in rows:need(key not in out,'unique negative-source JSON keys');out[key]=value
 return out

def parse(raw):
 need(len(raw)<=128*1024*1024,'bounded original JSON role')
 def invalid(value):raise ValueError('Nonfinite negative-source token '+value)
 return json.loads(raw.decode('utf-8'),parse_int=Number,parse_float=Number,parse_constant=invalid,object_pairs_hook=pairs)

def text(value):
 # This finite current source is real UTF-8. Refuse unsupported lone UTF-16
 # surrogates rather than silently substitute or normalize source identity.
 return json.dumps(value,ensure_ascii=False,separators=(',',':')).encode('utf-8')

def canonical_tokens(value,depth=0):
 need(depth<=256,'bounded negative canonical depth')
 if isinstance(value,Number):
  need(NUMBER.fullmatch(value) and math.isfinite(float(value)),'finite original number token');return value.encode('ascii')
 if isinstance(value,str):return text(value)
 if value is None:return b'null'
 if type(value) is bool:return b'true' if value else b'false'
 if isinstance(value,list):return b'['+b','.join(canonical_tokens(x,depth+1) for x in value)+b']'
 need(type(value) is dict,'only original JSON data in negative canonical source')
 keys=sorted(value,key=lambda k:k.encode('utf-16-be','surrogatepass'))
 return b'{'+b','.join(text(k)+b':'+canonical_tokens(value[k],depth+1) for k in keys)+b'}'

def differences(a,b,path=()):
 if type(a) is not type(b):return[path]
 if isinstance(a,dict):
  if set(a)!=set(b):return[path]
  return[p for k in sorted(a) for p in differences(a[k],b[k],path+(k,))]
 if isinstance(a,list):
  if len(a)!=len(b):return[path]
  return[p for i,(x,y) in enumerate(zip(a,b)) for p in differences(x,y,path+(i,))]
 return [] if a==b else [path]

def members(file):
 with zipfile.ZipFile(file) as z:
  need(z.testzip() is None,'negative/base actual ZIP CRC');return{r.filename:z.read(r) for r in z.infolist()}

def capture(file,read_archive):
 info=read_archive(file);raw=members(file);manifest=info['manifest'];project={'model':parse(raw['authored/model.json']),'sketches':[]}
 if 'authored/surfacing.json' in raw:project['surfacing']=parse(raw['authored/surfacing.json'])
 for descriptor in manifest['entries']:
  if descriptor['role']=='sketch':project['sketches'].append({'id':descriptor['logicalId'],'data':parse(raw[descriptor['path']])})
 project['sketches'].sort(key=lambda r:r['id'].encode('utf-16-be','surrogatepass'))
 need('authored/manufacturing.json' in raw,'actual saved assigned material metadata required for this negative family')
 manufacturing=parse(raw['authored/manufacturing.json'])
 # Metadata comes from the real canonical Worker writer. Sketch source uses
 # SketchIO.serializeSketch -> JSON.stringify; retain its actual number tokens
 # while sorting property names for the geometry hash, without changing bytes.
 for name,value in [('model',project['model']),('manufacturing',manufacturing)]:need(canonical_tokens(value)==raw['authored/'+name+'.json'],'actual original metadata canonical spelling, including numeric tokens')
 revision='sha256-'+sha(canonical_tokens({'kind':DOMAIN,'project':project}))
 need(manufacturing['revision']==revision,'independent full original project hash, numeric spellings and domain MUST match actual saved manufacturing revision')
 return info,raw,project,manufacturing,revision

def semantic_change(base,receipt,name):
 history=base['model']['history'];indices=[i for i,r in enumerate(history) if r['type']=='WORKER_CENTERED_BLIND_HOLE_V1'];need(len(indices)==1,'one genuine semantic blind feature')
 index=indices[0];p=history[index]['params'];binding=receipt['binding'];need(str(p['featureId'])==str(binding['blind']['featureId']),'actual saved blind feature binding')
 if name=='equal-depth':
  parent=[r['params'] for r in history if r['type']=='WORKER_SELECTED_PROFILE_EXTRUDE_V2' and str(r['params']['featureId'])==str(binding['profile']['featureId'])];need(len(parent)==1 and parent[0]['depth']=='plate' and p['depth']=='recess','actual named independent parent/blind depths')
  return ('model','history',index,'params','depth'),'plate'
 need(name=='wrong-entry','exact finite negative family')
 saved=receipt['saves'][1];body=saved['before']['capture']['solids']['bodies'];need(len(body)==1,'actual saved body');rows=[r['id'] for r in body[0]['selections']['plan']['faces'] if r['role']=='first-cap' and r['originFeatureId']==binding['profile']['featureId']]
 need(len(rows)==1 and rows[0]!=p['entryFaceId']==binding['blind']['entryFaceId'],'actual distinct public wrong-role first cap, no opaque-ID parsing')
 return ('model','history',index,'params','entryFaceId'),rows[0]

def mutate_string(tree,path,value):
 parent=tree
 for key in path[:-1]:parent=parent[key]
 need(type(parent[path[-1]]) is str and type(value) is str,'negative mutates one authored STRING, never numeric geometry or evidence');parent[path[-1]]=value

def rewrite(source,dest,receipt,name,archive):
 read_archive,structure,rebuild,manifest_row,canonical,root_record=archive
 info,raw,base,manufacturing,old_revision=capture(source,read_archive);project=copy.deepcopy(base);where,value=semantic_change(base,receipt,name);mutate_string(project,where,value)
 need(differences(base,project)==[where],'one exact intended project string difference')
 revised='sha256-'+sha(canonical_tokens({'kind':DOMAIN,'project':project}));need(revised!=old_revision,'negative changed actual geometry-source revision')
 metadata=copy.deepcopy(manufacturing);metadata['revision']=revised
 replacements={'authored/model.json':canonical_tokens(project['model']),'authored/manufacturing.json':canonical_tokens(metadata)}
 rows=[dict(r) for r in structure(Path(source).read_bytes())];manifest=copy.deepcopy(info['manifest'])
 for entry_path,content in replacements.items():
  row=[r for r in rows if r['path']==entry_path];desc=[r for r in manifest['entries'] if r['path']==entry_path];need(len(row)==len(desc)==1,'exact original role/descriptor, never a new archive entry')
  compressor=zlib.compressobj(6,zlib.DEFLATED,-15);compressed=compressor.compress(content)+compressor.flush();row[0].update(bytes=len(content),crc=binascii.crc32(content)&0xffffffff,compressed=compressed);desc[0].update(bytes=len(content),sha256=sha(content))
 manifest['designRevision']=sha(canonical(root_record(manifest)));rows[-1]=manifest_row(manifest);Path(dest).write_bytes(rebuild(rows))
 return inspect(source,dest,receipt,name,archive)

def inspect(source,negative,receipt,name,archive):
 """Independent validation path: does NOT invoke the negative rewriter."""
 read_archive,structure,rebuild,manifest_row,canonical,root_record=archive
 original,original_bytes,before,old_metadata,old_revision=capture(source,read_archive)
 changed,changed_bytes,after,new_metadata,new_revision=capture(negative,read_archive)
 need(set(original_bytes)==set(changed_bytes),'same actual entry roster, no optional/foreign payload added or lost')
 need(list(original_bytes)==list(changed_bytes),'same ordered actual archive members')
 allowed={'authored/model.json','authored/manufacturing.json','manifest.json'}
 need({k for k in original_bytes if original_bytes[k]!=changed_bytes[k]}==allowed,'ONLY intended model, manufacturing revision and manifest change')
 where,value=semantic_change(before,receipt,name);need(differences(before,after)==[where],'complete project differs at exactly one intended string leaf; ALL numeric tokens/sketches/surfacing/IDs/ordering exact')
 target=after
 for key in where:target=target[key]
 need(type(target) is str and target==value,'actual requested semantic negative value')
 need(differences(old_metadata,new_metadata)==[('revision',)] and new_metadata['revision']==new_revision and old_revision!=new_revision,'ONLY domain-separated material revision changes; assignments/accepted metrics remain original, never fabricated positive evidence')
 before_manifest,after_manifest=original['manifest'],changed['manifest'];expected=copy.deepcopy(before_manifest)
 for d in expected['entries']:
  if d['path'] in allowed-{'manifest.json'}:d.update(bytes=len(changed_bytes[d['path']]),sha256=sha(changed_bytes[d['path']]))
 expected['designRevision']=sha(canonical(root_record(expected)));need(after_manifest==expected,'exact dependent descriptors/root hash; no policy/encoding/required/source-role changes')
 old_rows=structure(Path(source).read_bytes());new_rows=structure(Path(negative).read_bytes());need([r['path'] for r in old_rows]==[r['path'] for r in new_rows],'complete physical member order preserved')
 entries=[]
 for a,b in zip(old_rows,new_rows):
  if a['path'] not in allowed:need(a==b,'unrelated original compressed span/local descriptor/bytes remain EXACT')
  entries.append({'path':a['path'],'changed':a['path'] in allowed,'beforeContentSha256':sha(original_bytes[a['path']]),'afterContentSha256':sha(changed_bytes[b['path']]),'beforeCompressedSha256':sha(a['compressed']),'afterCompressedSha256':sha(b['compressed'])})
 return {'version':1,'negativeOnly':True,'baseSha256':original['sha256'],'negativeSha256':changed['sha256'],'baseDesignRevision':before_manifest['designRevision'],'negativeDesignRevision':after_manifest['designRevision'],'geometryDomain':DOMAIN,'beforeGeometryRevision':old_revision,'afterGeometryRevision':new_revision,'projectStringPath':list(where),'projectStringValue':value,'changedEntries':sorted(allowed),'entries':entries,'numericPolicy':'verbatim-original-JSON-number-tokens/base-geometry-hash-authenticated/no-new-numbers'}
