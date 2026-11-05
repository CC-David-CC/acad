#!/usr/bin/env python3
"""Export a prepared CAD build's source/notices outside its public app assets."""
import argparse,ctypes,errno,hashlib,json,os,re,shutil,tempfile
from html.parser import HTMLParser
from pathlib import Path
FORK='67d3432921f2aa4256893a618cd8f11ec732aa51';ENGINE='8c4f30048fe65d9205c310d164b45d00d3fe77c3';JS='81996d394b9fd2fcd7b02a0448bf7968c2decc04969d2be7ace4512cbfc5620a';WASM='13617eda9a2118edfd1244b5d46523e7d9628a87ec995a0237b2b5cc58d532f2';NAME=re.compile(r'[A-Za-z0-9][A-Za-z0-9._-]{0,127}\Z')
def sha(path):
 h=hashlib.sha256()
 with path.open('rb') as f:
  while b:=f.read(1024*1024):h.update(b)
 return h.hexdigest()
class Links(HTMLParser):
 def __init__(self):super().__init__();self.values=[]
 def handle_starttag(self,tag,attrs):
  if tag=='a':self.values.extend(v for k,v in attrs if k=='href')
def run(source,out):
 if source.is_symlink():raise ValueError('Source directory must not be a symlink')
 source=source.resolve(strict=True);out=out.absolute()
 if out.exists() or out.is_symlink() or out in source.parents or source in out.parents or not out.parent.is_dir():raise ValueError('Fresh separate private output required')
 receipt=json.loads((source/'BUILD-RECEIPT.json').read_bytes())
 if receipt.get('forkCommit')!=FORK or receipt.get('workerInterpreterCommit')!=ENGINE or receipt.get('workerOcctInputs')!={'main.js':JS,'main.wasm':WASM}:raise ValueError('CAD receipt source/runtime mismatch')
 static=source/'static';wasm=static/(WASM[:20]+'.wasm')
 if wasm.is_symlink() or sha(wasm)!=WASM:raise ValueError('Clean worker runtime mismatch')
 names=sorted(p.name for p in source.iterdir() if p.is_file() and (p.name.endswith(('.txt','.zip')) or p.name in ('SOURCE-INDEX.html','BUILD-RECEIPT.json')))
 if not names or len(names)>64 or any(not NAME.fullmatch(n) for n in names) or 'SOURCE-INDEX.html' not in names:raise ValueError('Invalid source inventory')
 parser=Links();parser.feed((source/'SOURCE-INDEX.html').read_text(encoding='utf-8'))
 if not parser.values or len(parser.values)!=len(set(parser.values)) or set(parser.values)!=set(names)-{'SOURCE-INDEX.html'}:raise ValueError('Source index is not a complete exact inventory')
 temp=Path(tempfile.mkdtemp(prefix='.cad-source-',dir=out.parent))
 try:
  files={}
  for name in names:
   f=source/name
   if f.is_symlink() or not f.is_file() or f.stat().st_size>128*1024*1024:raise ValueError('Unsafe source asset')
   shutil.copyfile(f,temp/name);files[name]={'bytes':f.stat().st_size,'sha256':sha(f)}
   if sha(temp/name)!=files[name]['sha256']:raise ValueError('Source changed during copy')
  raw=(json.dumps({'version':'codi-cad-source-registry/1','files':files},sort_keys=True,indent=2)+'\n').encode();(temp/'manifest.json').write_bytes(raw)
  if out.exists() or out.is_symlink():raise ValueError('Output appeared')
  libc=ctypes.CDLL(None,use_errno=True)
  if not hasattr(libc,'renameat2'):raise ValueError('Atomic no-replace publication unavailable')
  if libc.renameat2(-100,os.fsencode(temp),-100,os.fsencode(out),1)!=0:
   error=ctypes.get_errno();raise OSError(error,os.strerror(error),str(out))
  print(json.dumps({'manifest':hashlib.sha256(raw).hexdigest(),'files':len(files),'fork':FORK,'worker':ENGINE}))
 finally:
  if temp.exists():shutil.rmtree(temp)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('prepared',type=Path);p.add_argument('output',type=Path);a=p.parse_args();run(a.prepared,a.output)
