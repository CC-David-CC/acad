"""Negative-only copies of a genuinely saved, unassigned extent model.
No positive authoring/model seed. Every unchanged compressed entry is retained.
"""
import copy,hashlib,json,math,re,sys,zipfile,zlib,binascii
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'native-cad-container'))
from archive_oracle import read_archive,structure,rebuild,manifest_row,canonical,root_record
TYPE='WORKER_SELECTED_PROFILE_EXTENT_EXTRUDE_V1'
sha=lambda b:hashlib.sha256(b).hexdigest()
def need(v,m):
 if not v:raise ValueError(m)
class Number(str):pass
def pairs(rows):
 out={}
 for k,v in rows:need(k not in out,'unique original JSON keys');out[k]=v
 return out
def parse(b):return json.loads(b.decode('utf-8'),parse_int=Number,parse_float=Number,parse_constant=lambda _:(_ for _ in ()).throw(ValueError('nonfinite original JSON')),object_pairs_hook=pairs)
def tokens(x):
 if isinstance(x,Number):need(re.fullmatch(r'-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?',x) and math.isfinite(float(x)),'finite original number');return x.encode('ascii')
 if isinstance(x,str):return json.dumps(x,ensure_ascii=False,separators=(',',':')).encode('utf-8')
 if x is None:return b'null'
 if type(x) is bool:return b'true' if x else b'false'
 if type(x) is list:return b'['+b','.join(map(tokens,x))+b']'
 need(type(x) is dict,'original own JSON data');return b'{'+b','.join(tokens(k)+b':'+tokens(x[k]) for k in sorted(x,key=lambda k:k.encode('utf-16-be','surrogatepass')))+b'}'
def members(file):
 with zipfile.ZipFile(file) as z:need(z.testzip() is None,'actual archive CRC');return {x.filename:z.read(x) for x in z.infolist()}
def mutate(model,name):
 rows=[r for r in model['history'] if r['type']==TYPE];need(len(rows)==1,'one actual extent source');p=rows[0]['params'];need(p['extent']=='one-sided' and float(p['distance'])==-8,'negative derives from genuine unassigned negative8 Save')
 if name=='zero-distance':p['distance']=Number('0')
 elif name=='unknown-mode':p['extent']='unknown'
 elif name=='inactive-field':need('length' not in p,'no previous extra field');p['length']=Number('8')
 else:raise ValueError('unknown negative case')
def inspect(base,file,name):
 x,y=read_archive(base),read_archive(file);a,b=members(base),members(file);need(list(a)==list(b),'unchanged complete member roster/order');need({k for k in a if a[k]!=b[k]}=={'authored/model.json','manifest.json'},'only actual model and dependent manifest changed');expected=copy.deepcopy(parse(a['authored/model.json']));mutate(expected,name);need(parse(b['authored/model.json'])==expected and tokens(expected)==b['authored/model.json'],'exact intended one-field model mutation, numeric spellings retained');m=copy.deepcopy(x['manifest']);d=[d for d in m['entries'] if d['path']=='authored/model.json'];need(len(d)==1,'one original model descriptor');d[0].update(bytes=len(b['authored/model.json']),sha256=sha(b['authored/model.json']));m['designRevision']=sha(canonical(root_record(m)));need(y['manifest']==m,'only hash/length/root dependencies changed');old,new=structure(Path(base).read_bytes()),structure(Path(file).read_bytes());need(all(p==q for p,q in zip(old,new) if p['path'] not in ('authored/model.json','manifest.json')),'ALL other original compressed/local spans exact');return {'negativeOnly':True,'baseSha256':x['sha256'],'negativeSha256':y['sha256'],'name':name,'changedEntries':['authored/model.json','manifest.json'],'unchangedEntrySpansExact':True,'originalNumericTokens':'retained'}
def make(base,destination):
 base=Path(base);info=read_archive(base);raw=members(base);need('authored/manufacturing.json' not in raw,'unassigned genuine source, no manufactured revision/facts to fabricate');need(tokens(parse(raw['authored/model.json']))==raw['authored/model.json'],'original model exact canonical number spelling');destination=Path(destination);destination.mkdir(parents=True,exist_ok=False);out=[]
 for name in ('zero-distance','unknown-mode','inactive-field'):
  model=copy.deepcopy(parse(raw['authored/model.json']));mutate(model,name);body=tokens(model);rows=[dict(x) for x in structure(base.read_bytes())];row=[x for x in rows if x['path']=='authored/model.json'][0];codec=zlib.compressobj(6,zlib.DEFLATED,-15);row.update(bytes=len(body),crc=binascii.crc32(body)&0xffffffff,compressed=codec.compress(body)+codec.flush());m=copy.deepcopy(info['manifest']);d=[x for x in m['entries'] if x['path']=='authored/model.json'][0];d.update(bytes=len(body),sha256=sha(body));m['designRevision']=sha(canonical(root_record(m)));rows[-1]=manifest_row(m);file=destination/(name+'.cad');file.write_bytes(rebuild(rows));out.append({'name':name,'path':str(file),'code':'INVALID_REQUEST','proof':inspect(base,file,name)})
 return out
if __name__=='__main__':
 need(len(sys.argv)==4 and sys.argv[1]=='make','make ACTUAL_NEGATIVE_SAVE NEW_OUTPUT_DIR');print(json.dumps(make(sys.argv[2],sys.argv[3])))
