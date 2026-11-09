"""Negative-only drawings entry copies of an actual public native Save.

All original compressed/local entry spans except drawings and its dependent
manifest remain byte-identical. No model/source/Native facts are fabricated.
"""
import copy,hashlib,json,math,re,sys,zipfile,zlib,binascii
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'native-cad-container'))
from archive_oracle import read_archive,structure,rebuild,manifest_row,canonical,root_record
def need(v,m):
 if not v:raise ValueError(m)
sha=lambda x:hashlib.sha256(x).hexdigest()
class Number(str):pass
class Overflow(Number):pass
def pairs(items):
 out={}
 for k,v in items:need(k not in out,'unique actual JSON keys');out[k]=v
 return out
def parse(raw):return json.loads(raw.decode('utf-8'),parse_int=Number,parse_float=Number,parse_constant=lambda _:(_ for _ in ()).throw(ValueError('non-JSON original constant')),object_pairs_hook=pairs)
def tokens(x):
 if isinstance(x,Overflow):need(x=='1e999','one explicit NEGATIVE nonfinite JSON token');return x.encode()
 if isinstance(x,Number):need(re.fullmatch(r'-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?',x) and math.isfinite(float(x)),'finite original token');return x.encode()
 if isinstance(x,str):return json.dumps(x,ensure_ascii=False,separators=(',',':')).encode()
 if x is None:return b'null'
 if type(x) is bool:return b'true' if x else b'false'
 if type(x) is list:return b'['+b','.join(tokens(v) for v in x)+b']'
 need(type(x) is dict,'ordinary original JSON values');return b'{'+b','.join(tokens(k)+b':'+tokens(x[k]) for k in sorted(x,key=lambda k:k.encode('utf-16-be','surrogatepass')))+b'}'
def members(file):
 with zipfile.ZipFile(file) as z:need(z.testzip() is None,'actual original CRC');return{x.filename:z.read(x) for x in z.infolist()}
def change(value,name):
 need(type(value) is list and len(value)==1 and value[0]['version']=='4','one actual v4 saved definition')
 rows=[r for r in value[0]['requirements'] if r['kind']=='surface-finish'];need(len(rows)==1 and rows[0]['parameter']=='Ra' and rows[0]['maximum']=={'value':Number('3.2'),'unit':'micrometer'},'actual original raw Ra quantity')
 if name=='wrong-ra-unit':rows[0]['maximum']['unit']='millimeter'
 elif name=='nonfinite-json-quantity':rows[0]['maximum']['value']=Overflow('1e999')
 else:raise ValueError('unknown finite negative fixture')
def inspect(base,file,name):
 original,negative=read_archive(base),read_archive(file);a,b=members(base),members(file)
 need(list(a)==list(b) and {k for k in a if a[k]!=b[k]}=={'authored/drawings.json','manifest.json'},'only actual drawings and dependent manifest changed')
 expected=copy.deepcopy(parse(a['authored/drawings.json']));change(expected,name);body=tokens(expected);need(body==b['authored/drawings.json'],'exact intended unit/token mutation with all other numeric spellings retained')
 expected_manifest=copy.deepcopy(original['manifest']);descriptor=[d for d in expected_manifest['entries'] if d['path']=='authored/drawings.json'];need(len(descriptor)==1,'actual drawing manifest descriptor')
 descriptor[0].update(bytes=len(body),sha256=sha(body));expected_manifest['designRevision']=sha(canonical(root_record(expected_manifest)));need(negative['manifest']==expected_manifest,'exact dependent SHA/length/root only')
 old,new=structure(Path(base).read_bytes()),structure(Path(file).read_bytes());need(all(x==y for x,y in zip(old,new) if x['path'] not in ('authored/drawings.json','manifest.json')),'all other raw/compressed/local entry spans exact')
 return{'negativeOnly':True,'baseSha256':original['sha256'],'negativeSha256':negative['sha256'],'name':name,'changedEntries':['authored/drawings.json','manifest.json'],'unchangedSpansExact':True,'originalNumberTokens':'retained'}
def make(base,destination):
 base=Path(base);info=read_archive(base);raw=members(base);need('authored/drawings.json' in raw and 'authored/manufacturing.json' not in raw,'actual saved unassigned v4 native model');need(tokens(parse(raw['authored/drawings.json']))==raw['authored/drawings.json'],'original canonical numeric spelling')
 destination=Path(destination);destination.mkdir(parents=True,exist_ok=False);out=[]
 for name in ('wrong-ra-unit','nonfinite-json-quantity'):
  value=copy.deepcopy(parse(raw['authored/drawings.json']));change(value,name);body=tokens(value);rows=[dict(x) for x in structure(base.read_bytes())];row=[x for x in rows if x['path']=='authored/drawings.json'][0];codec=zlib.compressobj(6,zlib.DEFLATED,-15);row.update(bytes=len(body),crc=binascii.crc32(body)&0xffffffff,compressed=codec.compress(body)+codec.flush())
  manifest=copy.deepcopy(info['manifest']);entry=[d for d in manifest['entries'] if d['path']=='authored/drawings.json'][0];entry.update(bytes=len(body),sha256=sha(body));manifest['designRevision']=sha(canonical(root_record(manifest)));rows[-1]=manifest_row(manifest)
  file=destination/(name+'.cad');file.write_bytes(rebuild(rows))
  # Overflow is rejected at the codec's canonical finite JSON boundary, before
  # pure quantity capture; wrong finite unit reaches INVALID_REQUEST instead.
  out.append({'name':name,'path':str(file),'code':'INVALID_REQUEST' if name=='wrong-ra-unit' else 'CAD_ARCHIVE_INVALID','proof':inspect(base,file,name)})
 return out
if __name__=='__main__':
 need(len(sys.argv)==4 and sys.argv[1]=='make','make ACTUAL_PUBLIC_SAVE NEW_OUTPUT');print(json.dumps(make(sys.argv[2],sys.argv[3])))
